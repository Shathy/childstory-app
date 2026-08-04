import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { CreateStoryDto } from './dto/create-story.dto';
import { StoriesService } from './stories.service';

@UseGuards(SupabaseAuthGuard)
@Controller('stories')
export class StoriesController {
  constructor(private readonly storiesService: StoriesService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateStoryDto) {
    return this.storiesService.createAndGenerate(req.user.id, dto);
  }

  @Get()
  list(@Req() req: any) {
    return this.storiesService.listForUser(req.user.id);
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.storiesService.findOne(req.user.id, id);
  }
}
