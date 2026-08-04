import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../supabase/supabase.module';
import { TEXT_GENERATOR } from '../ai/ai.module';
import { TextGeneratorProvider } from '../ai/text-generator.interface';
import { CreateStoryDto } from './dto/create-story.dto';

@Injectable()
export class StoriesService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
    @Inject(TEXT_GENERATOR) private readonly textGenerator: TextGeneratorProvider,
  ) {}

  async createAndGenerate(userId: string, dto: CreateStoryDto) {
    // 1) insert the story row as "generating_text"
    const { data: story, error: insertError } = await this.supabase
      .from('stories')
      .insert({
        user_id: userId,
        child_name: dto.childName,
        child_gender: dto.childGender,
        child_age: dto.childAge,
        appearance: dto.appearance,
        setting: dto.setting,
        moral_value: dto.moralValue,
        language: dto.language,
        status: 'generating_text',
      })
      .select()
      .single();

    if (insertError) throw insertError;

    try {
      // 2) call the text AI provider
      const generated = await this.textGenerator.generateStory({
        childName: dto.childName,
        childGender: dto.childGender,
        childAge: dto.childAge,
        setting: dto.setting,
        moralValue: dto.moralValue,
        language: dto.language,
      });

      // 3) persist pages
      const pageRows = generated.pages.map((p) => ({
        story_id: story.id,
        page_number: p.pageNumber,
        text_content: p.text,
        image_prompt: p.imagePrompt,
        image_status: 'not_requested', // image generation disabled for now
      }));

      const { error: pagesError } = await this.supabase.from('story_pages').insert(pageRows);
      if (pagesError) throw pagesError;

      // 4) mark story as text_ready (images are opt-in / infra-only right now)
      const { data: updated, error: updateError } = await this.supabase
        .from('stories')
        .update({ title: generated.title, status: 'text_ready', updated_at: new Date().toISOString() })
        .eq('id', story.id)
        .select()
        .single();

      if (updateError) throw updateError;
      return updated;
    } catch (err) {
      await this.supabase.from('stories').update({ status: 'failed' }).eq('id', story.id);
      throw err;
    }
  }

  async findOne(userId: string, storyId: string) {
    const { data: story, error } = await this.supabase
      .from('stories')
      .select('*, story_pages(*)')
      .eq('id', storyId)
      .eq('user_id', userId)
      .order('page_number', { referencedTable: 'story_pages', ascending: true })
      .single();

    if (error || !story) throw new NotFoundException('Story not found');
    return story;
  }

  async listForUser(userId: string) {
    const { data, error } = await this.supabase
      .from('stories')
      .select('id, title, setting, moral_value, status, cover_image_url, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
}
