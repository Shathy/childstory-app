export interface CharacterAppearance {
  skinTone?: string;
  hairType?: string;
  hairColor?: string;
  glasses?: boolean;
  sourceImageUrl?: string | null;
}

export interface ImageGenerationRequest {
  prompt: string;
  appearance: CharacterAppearance;
  /** used so the provider can keep the same character consistent across pages */
  characterReferenceId?: string;
}

export interface ImageGenerationResult {
  imageUrl: string;
}

/**
 * Any image-generation provider (Stable Diffusion, Flux, DALL-E, Midjourney API...)
 * implements this. Not wired to a real provider yet — see NoopImageProvider.
 */
export interface ImageGeneratorProvider {
  generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResult>;
}
