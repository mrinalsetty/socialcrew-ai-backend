import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { StrategyAgentService } from '../agents/strategy-agent.service';
import { ContentCreatorService } from '../agents/content-creator.service';
import { SocialAnalystService } from '../agents/social-analyst.service';
import type {
  ConversationMessage,
  GenerateRequest,
  GenerateResponse,
  TeamInfo,
} from './generate.types';

@Injectable()
export class GenerateService {
  constructor(
    private readonly strategyAgentService: StrategyAgentService,
    private readonly contentCreatorService: ContentCreatorService,
    private readonly socialAnalystService: SocialAnalystService,
  ) {}

  async generateFromTopic(input: GenerateRequest): Promise<GenerateResponse> {
    const team = this.buildTeam();

    const strategy = await this.strategyAgentService.run(
      input,
      team.strategyName,
    );

    const creator = await this.contentCreatorService.run(
      input,
      strategy,
      team.creatorName,
    );

    const analyst = await this.socialAnalystService.run(
      input,
      strategy,
      creator,
      team.analystName,
    );

    const conversation: ConversationMessage[] = [
      this.makeMessage('strategy', strategy.agentName, strategy.intro),
      this.makeMessage('strategy', strategy.agentName, strategy.fullResponse),
      this.makeMessage(
        'strategy',
        strategy.agentName,
        this.formatListMessage(
          'Here are the main angles I prioritised',
          strategy.recommendedAngles,
        ),
      ),
      this.makeMessage(
        'strategy',
        strategy.agentName,
        this.formatListMessage(
          'And these are the audience groups I’d especially keep in mind',
          strategy.audienceSegments,
        ),
      ),

      this.makeMessage('creator', creator.agentName, creator.intro),
      this.makeMessage('creator', creator.agentName, creator.overview),
      this.makeMessage(
        'creator',
        creator.agentName,
        this.formatPostLineupMessage(creator.posts),
      ),
      this.makeMessage(
        'creator',
        creator.agentName,
        this.formatListMessage(
          'I also kept these shared hashtags ready so the overall direction stays cohesive',
          creator.commonHashtags,
        ),
      ),

      this.makeMessage('analyst', analyst.agentName, analyst.intro),
      this.makeMessage('analyst', analyst.agentName, analyst.fullResponse),
      this.makeMessage(
        'analyst',
        analyst.agentName,
        this.formatListMessage(
          `My strongest pick is Option ${analyst.bestPost}. Here’s the quick comparison across the set`,
          analyst.comparison,
        ),
      ),
      this.makeMessage(
        'analyst',
        analyst.agentName,
        this.formatListMessage(
          'Here are the audience-fit notes I’d want you to keep in mind',
          analyst.audienceFitNotes,
        ),
      ),
    ];

    return {
      platform: input.platform,
      team,
      conversation,
      strategy,
      creator,
      analyst,
    };
  }

  private makeMessage(
    agentId: 'strategy' | 'creator' | 'analyst',
    agentName: string,
    text: string,
  ): ConversationMessage {
    return {
      id: randomUUID(),
      agentId,
      agentName,
      text,
      timestamp: new Date().toISOString(),
    };
  }

  private formatListMessage(title: string, items: string[]): string {
    if (items.length === 0) {
      return title;
    }

    return `${title}:\n- ${items.join('\n- ')}`;
  }

  private formatPostLineupMessage(
    posts: { id: number; title: string }[],
  ): string {
    if (posts.length === 0) {
      return 'I wasn’t able to create the post set yet.';
    }

    return `I created 5 options with intentionally different directions:\n- ${posts
      .map((post) => `Option ${post.id}: ${post.title}`)
      .join('\n- ')}`;
  }

  private buildTeam(): TeamInfo {
    return {
      strategyName: this.pick(['Amelia', 'Charlotte', 'Ava', 'Isobel']),
      creatorName: this.pick(['Sophie', 'Freya', 'Lily', 'Eleanor']),
      analystName: this.pick(['Grace', 'Isla', 'Maya', 'Ruby']),
    };
  }

  private pick(items: string[]): string {
    return items[Math.floor(Math.random() * items.length)] ?? items[0];
  }
}
