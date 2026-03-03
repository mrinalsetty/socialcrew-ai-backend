import { Injectable, InternalServerErrorException } from '@nestjs/common';
import Groq from 'groq-sdk';
import type {
  GenerateRequest,
  StrategyOutput,
} from '../generate/generate.types';

type RawStrategyResponse = {
  intro?: unknown;
  fullResponse?: unknown;
  recommendedAngles?: unknown;
  audienceSegments?: unknown;
};

@Injectable()
export class StrategyAgentService {
  async run(
    input: GenerateRequest,
    agentName: string,
  ): Promise<StrategyOutput> {
    const groq = this.getClient();

    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_ANALYST_MODEL || 'llama-3.3-70b-versatile',
      temperature: 0.45,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `
You are a warm, polished, human-friendly social media strategist.

Your first name is ${agentName}.

Return ONLY valid JSON in this exact shape:
{
  "intro": "one friendly introduction message",
  "fullResponse": "a comprehensive but human-friendly strategy explanation",
  "recommendedAngles": ["angle 1", "angle 2", "angle 3"],
  "audienceSegments": ["segment 1", "segment 2", "segment 3"]
}

Rules:
- Sound like a real teammate, not a bot.
- Use only your first name naturally.
- Be warm, polished, stylish, and easy to understand.
- Avoid technical jargon.
- Explain what strategy you chose, why you chose it, how the platform affects the approach, and who the content is best for.
- The user should feel like you are personally guiding them.
- Keep it detailed but natural and conversational.
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

Please introduce yourself first, then clearly explain:
1. the overall strategy,
2. the strongest angles,
3. the platform-specific reasoning,
4. the audience segments,
5. why this approach should work.
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
          : `Hi, I’m ${agentName}. I’ll map out the strategy and make sure the direction feels right before we write anything.`,
      fullResponse:
        typeof parsed.fullResponse === 'string'
          ? parsed.fullResponse
          : `Here’s how I’d approach this. I’d position the idea in a way that feels relevant to the audience, native to ${input.platform}, and clear enough that the content feels intentional rather than generic.`,
      recommendedAngles: Array.isArray(parsed.recommendedAngles)
        ? parsed.recommendedAngles.map((item: unknown) => String(item))
        : [],
      audienceSegments: Array.isArray(parsed.audienceSegments)
        ? parsed.audienceSegments.map((item: unknown) => String(item))
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

  private parseJson(raw: string): RawStrategyResponse {
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

      return parsedUnknown as RawStrategyResponse;
    } catch {
      throw new InternalServerErrorException(
        'Strategy Agent returned invalid JSON.',
      );
    }
  }
}
