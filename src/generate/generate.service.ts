import { Injectable } from '@nestjs/common';
import { SocialCrewGraph } from './socialcrew.graph';
import type { GeneratedPost } from '../agents/content-creator.service';
import type { GenerateRequest } from './generate.types';

export interface GenerateResponse {
  contentCreator: GeneratedPost[];
  contentSummary: string;
  socialAnalyst: {
    bestPost: number;
    reason: string;
    suggestions: string[];
    positioning: string;
  };
}

@Injectable()
export class GenerateService {
  constructor(private readonly socialCrewGraph: SocialCrewGraph) {}

  async generateFromTopic(input: GenerateRequest): Promise<GenerateResponse> {
    const result = await this.socialCrewGraph.invoke(input);

    return {
      contentCreator: result.creatorOutput?.posts ?? [],
      contentSummary:
        result.creatorOutput?.summary ?? 'No creator summary returned.',
      socialAnalyst: {
        bestPost: result.analystOutput?.bestPost ?? 1,
        reason: result.analystOutput?.reason ?? 'No analyst reason returned.',
        suggestions: result.analystOutput?.suggestions ?? [],
        positioning:
          result.analystOutput?.positioning ??
          'No positioning recommendation returned.',
      },
    };
  }
}
