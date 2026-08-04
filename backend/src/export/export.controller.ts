import { Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { ExportService } from './export.service';

@UseGuards(SupabaseAuthGuard)
@Controller('stories/:id/export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Post('pdf')
  async exportPdf(@Req() req: any, @Param('id') id: string) {
    const url = await this.exportService.exportStoryToPdf(req.user.id, id);
    return { pdfUrl: url };
  }
}
