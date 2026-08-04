import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { ExportModule } from '../export/export.module';
import { StoriesController } from './stories.controller';
import { StoriesService } from './stories.service';

@Module({
  imports: [AiModule, ExportModule],
  controllers: [StoriesController],
  providers: [StoriesService],
})
export class StoriesModule {}
