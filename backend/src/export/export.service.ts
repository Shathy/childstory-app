import { Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseClient } from '@supabase/supabase-js';
import puppeteer from 'puppeteer-core';
import { SUPABASE_CLIENT } from '../supabase/supabase.module';
import { buildStoryHtml } from './story-html.template';

@Injectable()
export class ExportService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
    private readonly config: ConfigService,
  ) {}

  /** Builds a print-quality, RTL-correct PDF and uploads it to Supabase Storage. */
  async exportStoryToPdf(userId: string, storyId: string): Promise<string> {
    const { data: story, error } = await this.supabase
      .from('stories')
      .select('*, story_pages(*)')
      .eq('id', storyId)
      .eq('user_id', userId)
      .order('page_number', { referencedTable: 'story_pages', ascending: true })
      .single();

    if (error || !story) throw new NotFoundException('Story not found');

    const pdfBuffer = await this.renderPdf(story);

    const path = `stories/${storyId}/${storyId}.pdf`;
    const { error: uploadError } = await this.supabase.storage
      .from('story-exports')
      .upload(path, pdfBuffer, { contentType: 'application/pdf', upsert: true });

    if (uploadError) throw uploadError;

    const { data: publicUrl } = this.supabase.storage.from('story-exports').getPublicUrl(path);

    await this.supabase.from('stories').update({ pdf_url: publicUrl.publicUrl }).eq('id', storyId);

    return publicUrl.publicUrl;
  }

  private async renderPdf(story: any): Promise<Buffer> {
    const html = buildStoryHtml(story);
    const executablePath = this.config.get<string>('CHROMIUM_EXECUTABLE_PATH');

    if (!executablePath) {
      throw new InternalServerErrorException(
        'CHROMIUM_EXECUTABLE_PATH is not set. Locally, point it to your installed Chrome/Chromium binary; ' +
          'on Render/Koyeb the provided Dockerfile installs system Chromium and sets it to /usr/bin/chromium automatically.',
      );
    }

    const browser = await puppeteer.launch({
      executablePath,
      headless: true,
      // Tuned for small free-tier containers (Render/Koyeb, ~512MB RAM):
      // - disable-dev-shm-usage: /dev/shm is tiny in containers, use /tmp instead
      // - single-process / no-zygote: avoids spawning extra Chromium processes
      // - disable-gpu: no GPU available anyway in these environments
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process',
        '--no-zygote',
      ],
    });

    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 900, height: 1200 }); // keeps rendering memory bounded
      // No external resources are loaded anymore (font is installed locally),
      // so we don't need to wait on network activity — just DOM ready.
      await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 60000 });
      const buffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: false,
      });
      return buffer as Buffer;
    } finally {
      await browser.close();
    }
  }
}
