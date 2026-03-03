import { Injectable, InternalServerErrorException } from '@nestjs/common';
import Groq from 'groq-sdk';
import type {
  AnalystOutput,
  CreatorOutput,
  GenerateRequest,
  StrategyOutput,
} from '../generate/generate.types';

type RawAnalystResponse = {
  intro?: unknown;
  fullResponse?: unknown;
  bestPost?: unknown;
  comparison?: unknown;
  audienceFitNotes?: unknown;
};

@Injectable()
export class SocialAnalystService {
  async run(
    input: GenerateRequest,
    strategy: StrategyOutput,
    creator: CreatorOutput,
    agentName: string,
  ): Promise<AnalystOutput> {
    const groq = this.getClient();

    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_ANALYST_MODEL || 'llama-3.3-70b-versatile',
      temperature: 0.28,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `
You are a polished, human-friendly social content analyst.

Your first name is ${agentName}.

Return ONLY valid JSON in this exact shape:
{
  "intro": "friendly self-introduction",
  "fullResponse": "comprehensive audience-friendly analysis",
  "bestPost": 1,
  "comparison": ["comparison point 1", "comparison point 2", "comparison point 3", "comparison point 4", "comparison point 5"],
  "audienceFitNotes": ["note 1", "note 2", "note 3"]
}

Rules:
- Sound like a real teammate, not a bot.
- Use only your first name naturally.
- Compare all 5 posts.
- Explain what each one is good for, who it suits, and what audience or demographic is likely to respond.
- Be thoughtful, clear, and easy to read.
- No markdown code fences.
          `.trim(),
        },
        {
          role: 'user',
          content: `
Topic: ${input.topic}
Platform: ${input.platform}
Audience: ${input.audience || 'Founders, creators, small business operators'}

Strategy:
${strategy.fullResponse}

Creator Overview:
${creator.overview}

Posts:
${JSON.stringify(creator.posts, null, 2)}

Common Hashtags:
${creator.commonHashtags.join(', ')}

Please:
1. introduce yourself,
2. analyse all 5 posts,
3. explain which is strongest and why,
4. explain who each one is best for,
5. keep it human and conversational.
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
          : `Hi, I’m ${agentName}. I’ve reviewed all five options and I’ll walk you through which one stands out and why.`,
      fullResponse:
        typeof parsed.fullResponse === 'string'
          ? parsed.fullResponse
          : 'I compared the five post directions for clarity, fit, audience relevance, tone, and platform style, and I’ve identified the strongest option based on which one feels most effective and naturally engaging.',
      bestPost:
        typeof parsed.bestPost === 'number'
          ? parsed.bestPost
          : Number(parsed.bestPost ?? 1),
      comparison: Array.isArray(parsed.comparison)
        ? parsed.comparison.map((item: unknown) => String(item))
        : [],
      audienceFitNotes: Array.isArray(parsed.audienceFitNotes)
        ? parsed.audienceFitNotes.map((item: unknown) => String(item))
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

  private parseJson(raw: string): RawAnalystResponse {
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

      return parsedUnknown as RawAnalystResponse;
    } catch {
      throw new InternalServerErrorException(
        'Analyst Agent returned invalid JSON.',
      );
    }
  }
}
