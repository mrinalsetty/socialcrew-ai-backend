import { Injectable, InternalServerErrorException } from '@nestjs/common';
import Groq from 'groq-sdk';
import type {
  CreatorOutput,
  GenerateRequest,
  GeneratedPost,
  StrategyOutput,
} from '../generate/generate.types';

type RawPost = {
  id?: unknown;
  title?: unknown;
  description?: unknown;
};

type RawCreatorResponse = {
  intro?: unknown;
  overview?: unknown;
  posts?: unknown;
  commonHashtags?: unknown;
};

@Injectable()
export class ContentCreatorService {
  async run(
    input: GenerateRequest,
    strategy: StrategyOutput,
    agentName: string,
  ): Promise<CreatorOutput> {
    const groq = this.getClient();

    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_CREATOR_MODEL || 'llama-3.1-8b-instant',
      temperature: 0.78,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `
You are a stylish, human-friendly social media creator.

Your first name is ${agentName}.

Return ONLY valid JSON in this exact shape:
{
  "intro": "friendly self-introduction",
  "overview": "human-friendly explanation of what you created, why you created it, and how each direction differs",
  "posts": [
    {
      "id": 1,
      "title": "concise title",
      "description": "platform-native post body"
    }
  ],
  "commonHashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"]
}

Rules:
- Generate exactly 5 posts.
- Generate exactly 5 hashtags shared across all posts.
- Sound like a real creative teammate, not a machine.
- In "overview", explicitly tell the user that you created 5 different post options and explain your reasoning, thought process, tone choices, and why each option is different.
- Make the writing platform-native:
  - LINKEDIN: longer, thoughtful, insight-driven
  - INSTAGRAM: concise, stylish, caption-like
  - X: punchy and short
  - THREADS: conversational and current
  - FACEBOOK: warm and community-friendly
  - YOUTUBE: title + description style, curiosity-driven
- Each post should feel intentionally different in angle, not just lightly rewritten.
- No markdown code fences.
          `.trim(),
        },
        {
          role: 'user',
          content: `
Topic: ${input.topic}
Platform: ${input.platform}
Brand Name: ${input.brandName || 'Personal Brand'}
Audience: ${input.audience || 'Founders, creators, small business operators'}
Tone: ${input.tone || 'Warm, polished, stylish'}
CTA Style: ${input.ctaStyle || 'Soft CTA'}

Strategy Intro: ${strategy.intro}
Strategy Response: ${strategy.fullResponse}
Recommended Angles: ${strategy.recommendedAngles.join(' | ')}
Audience Segments: ${strategy.audienceSegments.join(' | ')}

Please:
1. introduce yourself,
2. explain what you created and why,
3. explain the reasoning behind the 5 post directions,
4. generate 5 strong posts with title + description,
5. generate 5 shared hashtags.
          `.trim(),
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim() || '{}';
    const parsed = this.parseJson(raw);

    return {
      agentName,
      intro:
        typeof parsed.intro === 'string'
          ? parsed.intro
          : `Hi, I’m ${agentName}. I’ve taken the strategy and turned it into five distinct post directions for you.`,
      overview:
        typeof parsed.overview === 'string'
          ? parsed.overview
          : `I created five different post options so you can choose the one that best matches the tone, audience intent, and platform style you want. I varied the angles on purpose so you’re not looking at the same idea rewritten five times.`,
      posts: this.extractPosts(parsed.posts),
      commonHashtags: Array.isArray(parsed.commonHashtags)
        ? parsed.commonHashtags
            .map((item: unknown) => this.toStringOrNull(item))
            .filter((item): item is string => item !== null)
            .slice(0, 5)
        : [],
    };
  }

  private getClient(): Groq {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      throw new InternalServerErrorException('Missing GROQ_API_KEY');
    }

    return new Groq({ apiKey });
  }

  private parseJson(raw: string): RawCreatorResponse {
    const cleaned = raw
      .replace(/^```json/i, '')
      .replace(/^```/, '')
      .replace(/```$/, '')
      .trim();

    try {
      const parsedUnknown: unknown = JSON.parse(cleaned);

      if (!parsedUnknown || typeof parsedUnknown !== 'object') {
        return {};
      }

      return parsedUnknown as RawCreatorResponse;
    } catch {
      throw new InternalServerErrorException(
        'Creator Agent returned invalid JSON.',
      );
    }
  }

  private extractPosts(posts: unknown): GeneratedPost[] {
    if (!Array.isArray(posts)) {
      return [];
    }

    return posts.slice(0, 5).map((post: unknown, index: number) => {
      const rawPost = this.toRawPost(post);

      return {
        id: this.toNumberOrFallback(rawPost.id, index + 1),
        title:
          this.toStringOrNull(rawPost.title) ??
          `Creative Direction ${index + 1}`,
        description: this.toStringOrNull(rawPost.description) ?? '',
      };
    });
  }

  private toRawPost(value: unknown): RawPost {
    if (!value || typeof value !== 'object') {
      return {};
    }

    return value as RawPost;
  }

  private toStringOrNull(value: unknown): string | null {
    return typeof value === 'string' ? value : null;
  }

  private toNumberOrFallback(value: unknown, fallback: number): number {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }

    return fallback;
  }
}
