export interface StoryGenerationInput {
  childName: string;
  childGender: 'male' | 'female';
  childAge: number;
  setting: string; // e.g. "space", "forest"
  moralValue: string; // e.g. "honesty", "sharing"
  language: 'ar' | 'en';
}

export interface GeneratedStoryPage {
  pageNumber: number;
  text: string;
  /** short scene description, kept ready for the image generator later */
  imagePrompt: string;
}

export interface GeneratedStory {
  title: string;
  pages: GeneratedStoryPage[]; // 6-8 pages
  coverImagePrompt: string;
}

/** Any text-generation provider (free model now, paid later) must implement this. */
export interface TextGeneratorProvider {
  generateStory(input: StoryGenerationInput): Promise<GeneratedStory>;
}
