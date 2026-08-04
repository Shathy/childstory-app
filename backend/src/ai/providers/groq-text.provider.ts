import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GeneratedStory,
  StoryGenerationInput,
  TextGeneratorProvider,
} from '../text-generator.interface';

/**
 * Free-tier text provider. Groq offers a free tier with OpenAI-compatible
 * chat completions, so this same client shape can later target Gemini,
 * OpenRouter free models, or a local Ollama instance with minimal changes.
 */
@Injectable()
export class GroqTextProvider implements TextGeneratorProvider {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl = 'https://api.groq.com/openai/v1/chat/completions';

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('TEXT_AI_API_KEY') ?? '';
    this.model = this.config.get<string>('TEXT_AI_MODEL') ?? 'llama-3.1-70b-versatile';
  }

  async generateStory(input: StoryGenerationInput): Promise<GeneratedStory> {
    const prompt = this.buildPrompt(input);

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        temperature: 0.8,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You are a professional children\'s story writer. Always respond with valid JSON only, no markdown fences, no extra commentary.',
          },
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Text AI provider error: ${response.status} ${await response.text()}`);
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) throw new Error('Empty response from text AI provider');

    return JSON.parse(raw) as GeneratedStory;
  }

  private buildPrompt(input: StoryGenerationInput): string {
    const { childName, childGender, childAge, setting, moralValue, language } = input;
    const langInstruction =
      language === 'ar'
        ? 'اكتب القصة كاملة باللغة العربية الفصحى المبسطة.'
        : 'Write the whole story in simple English.';

    return `
Write a personalized children's story with these constraints:
- Main character: ${childName} (${childGender}), age ${childAge}
- Setting: ${setting}
- Moral value to teach: ${moralValue}
- Length: 6 to 8 pages, 2-4 short sentences per page, age-appropriate vocabulary
- ${langInstruction}

Return ONLY a JSON object with this exact shape:
{
  "title": "string",
  "coverImagePrompt": "short visual description of the cover scene, in English, for an image generator",
  "pages": [
    { "pageNumber": 1, "text": "string", "imagePrompt": "short visual scene description in English, for an image generator, keep the character's appearance consistent across pages" }
  ]
}
`.trim();
  }
}
