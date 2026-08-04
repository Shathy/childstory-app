import { Injectable } from '@nestjs/common';
import {
  ImageGenerationRequest,
  ImageGenerationResult,
  ImageGeneratorProvider,
} from '../image-generator.interface';

/**
 * Placeholder provider used while IMAGE_AI_ENABLED=false.
 * Keeps the full pipeline (story -> page -> image job) wired and testable
 * without spending on a paid image API. Swap with a real provider
 * (e.g. StableDiffusionProvider) later by changing ai.module.ts only.
 */
@Injectable()
export class NoopImageProvider implements ImageGeneratorProvider {
  async generateImage(_request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    // Returns a static placeholder so the frontend flow (status -> image slot) works end to end.
    return { imageUrl: '/placeholders/story-page-placeholder.png' };
  }
}
