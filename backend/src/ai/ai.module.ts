import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GroqTextProvider } from './providers/groq-text.provider';
import { NoopImageProvider } from './providers/noop-image.provider';

export const TEXT_GENERATOR = 'TEXT_GENERATOR';
export const IMAGE_GENERATOR = 'IMAGE_GENERATOR';

@Module({
  imports: [ConfigModule],
  providers: [
    { provide: TEXT_GENERATOR, useClass: GroqTextProvider },
    // Swap NoopImageProvider -> a real provider once IMAGE_AI_ENABLED=true and a budget exists.
    { provide: IMAGE_GENERATOR, useClass: NoopImageProvider },
  ],
  exports: [TEXT_GENERATOR, IMAGE_GENERATOR],
})
export class AiModule {}
