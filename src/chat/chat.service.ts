import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import Groq from 'groq-sdk';
import type {
  ConversationMessage,
  FollowUpRequest,
  FollowUpResponse,
  TeamAgentId,
} from '../generate/generate.types';

type RawFollowUpMessage = {
  agentId?: unknown;
  agentName?: unknown;
  text?: unknown;
};

type RawFollowUpResponse = {
  messages?: unknown;
};

@Injectable()
export class ChatService {
  async followUp(input: FollowUpRequest): Promise<FollowUpResponse> {
    const groq = this.getClient();

    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_ANALYST_MODEL || 'llama-3.3-70b-versatile',
      temperature: 0.45,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `
You are orchestrating a human-friendly group chat between three female British teammates inside SocialCrew AI.

Teammates:
- strategy = ${input.team.strategyName}
- creator = ${input.team.creatorName}
- analyst = ${input.team.analystName}

Return ONLY valid JSON in this exact shape:
{
  "messages": [
    {
      "agentId": "strategy",
      "agentName": "Amelia Sterling",
      "text": "short, natural, helpful reply"
    }
  ]
}

Rules:
- Replies should sound human, warm, polished, and stylish.
- Avoid technical jargon.
- The selected target agents are: ${input.targetAgents.join(', ')}.
- If one agent is targeted, that agent should definitely reply.
- Other agents may briefly chime in if helpful.
- Return between 1 and 3 messages.
- Keep replies conversational and useful.
- No markdown code fences.
          `.trim(),
        },
        {
          role: 'user',
          content: `
Original Topic: ${input.topic}
Platform: ${input.platform}
User Follow-up: ${input.userMessage}

Context:
Strategy Summary: ${input.strategySummary}
Creator Summary: ${input.creatorSummary}
Analyst Summary: ${input.analystSummary}
Post Titles: ${input.postTitles.join(' | ')}
Best Post: ${input.bestPost}
          `.trim(),
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim() || '{}';
    const parsed = this.parseJson(raw);

    const messages = Array.isArray(parsed.messages)
      ? parsed.messages
          .slice(0, 3)
          .map((item: unknown) => this.toMessage(item))
          .filter((message): message is ConversationMessage => message !== null)
      : [];

    return { messages };
  }

  private toMessage(value: unknown): ConversationMessage | null {
    if (!value || typeof value !== 'object') {
      return null;
    }

    const maybe = value as RawFollowUpMessage;

    const agentId = this.normalizeAgentId(maybe.agentId);
    const agentName =
      typeof maybe.agentName === 'string' ? maybe.agentName : '';
    const text = typeof maybe.text === 'string' ? maybe.text : '';

    if (!agentId || !agentName || !text) {
      return null;
    }

    return {
      id: randomUUID(),
      agentId,
      agentName,
      text,
      timestamp: new Date().toISOString(),
    };
  }

  private normalizeAgentId(value: unknown): TeamAgentId | null {
    if (value === 'strategy' || value === 'creator' || value === 'analyst') {
      return value;
    }

    return null;
  }

  private getClient(): Groq {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      throw new InternalServerErrorException('Missing GROQ_API_KEY');
    }

    return new Groq({ apiKey });
  }

  private parseJson(raw: string): RawFollowUpResponse {
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

      return parsedUnknown as RawFollowUpResponse;
    } catch {
      throw new InternalServerErrorException(
        'Follow-up conversation returned invalid JSON.',
      );
    }
  }
}
