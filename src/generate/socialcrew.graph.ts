import { Injectable } from '@nestjs/common';
import { Annotation, END, START, StateGraph } from '@langchain/langgraph';
import {
  ContentCreatorService,
  CreatorAgentOutput,
  GeneratedPost,
} from '../agents/content-creator.service';
import {
  AnalystAgentOutput,
  SocialAnalystService,
} from '../agents/social-analyst.service';
import type { GenerateRequest, SocialPlatform } from './generate.types';

const SocialCrewState = Annotation.Root({
  request: Annotation<GenerateRequest>,
  creatorOutput: Annotation<CreatorAgentOutput | null>,
  analystOutput: Annotation<AnalystAgentOutput | null>,
});

export interface SocialCrewGraphResult {
  request: GenerateRequest;
  creatorOutput: CreatorAgentOutput | null;
  analystOutput: AnalystAgentOutput | null;
}

@Injectable()
export class SocialCrewGraph {
  constructor(
    private readonly contentCreatorService: ContentCreatorService,
    private readonly socialAnalystService: SocialAnalystService,
  ) {}

  async invoke(request: GenerateRequest): Promise<SocialCrewGraphResult> {
    const graph = new StateGraph(SocialCrewState)
      .addNode('creator', async (state: unknown) => {
        const safeState = this.toGraphState(state);
        const creatorOutput = await this.contentCreatorService.run(
          safeState.request,
        );
        return { creatorOutput };
      })
      .addNode('analyst', async (state: unknown) => {
        const safeState = this.toGraphState(state);

        const analystOutput = await this.socialAnalystService.run(
          safeState.request,
          safeState.creatorOutput?.posts ?? [],
        );

        return { analystOutput };
      })
      .addEdge(START, 'creator')
      .addEdge('creator', 'analyst')
      .addEdge('analyst', END)
      .compile();

    const rawResult: unknown = await graph.invoke({
      request,
      creatorOutput: null,
      analystOutput: null,
    });

    return this.toGraphState(rawResult);
  }

  private toGraphState(state: unknown): SocialCrewGraphResult {
    if (!state || typeof state !== 'object') {
      return {
        request: {
          topic: '',
          platform: 'LINKEDIN',
          brandName: '',
          audience: '',
          tone: '',
          ctaStyle: '',
        },
        creatorOutput: null,
        analystOutput: null,
      };
    }

    const maybeState = state as Partial<SocialCrewGraphResult>;

    return {
      request: this.isGenerateRequest(maybeState.request)
        ? maybeState.request
        : {
            topic: '',
            platform: 'LINKEDIN',
            brandName: '',
            audience: '',
            tone: '',
            ctaStyle: '',
          },
      creatorOutput: this.isCreatorOutput(maybeState.creatorOutput)
        ? maybeState.creatorOutput
        : null,
      analystOutput: this.isAnalystOutput(maybeState.analystOutput)
        ? maybeState.analystOutput
        : null,
    };
  }

  private isGenerateRequest(value: unknown): value is GenerateRequest {
    if (!value || typeof value !== 'object') return false;

    const maybeValue = value as Partial<GenerateRequest>;

    return (
      typeof maybeValue.topic === 'string' &&
      this.isPlatform(maybeValue.platform)
    );
  }

  private isPlatform(value: unknown): value is SocialPlatform {
    return (
      value === 'LINKEDIN' ||
      value === 'YOUTUBE' ||
      value === 'FACEBOOK' ||
      value === 'X' ||
      value === 'INSTAGRAM' ||
      value === 'THREADS'
    );
  }

  private isCreatorOutput(value: unknown): value is CreatorAgentOutput {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const maybeValue = value as Partial<CreatorAgentOutput>;

    return (
      typeof maybeValue.summary === 'string' &&
      Array.isArray(maybeValue.posts) &&
      maybeValue.posts.every((post) => this.isGeneratedPost(post))
    );
  }

  private isGeneratedPost(value: unknown): value is GeneratedPost {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const maybePost = value as Partial<GeneratedPost>;

    return (
      typeof maybePost.id === 'number' &&
      typeof maybePost.title === 'string' &&
      typeof maybePost.content === 'string' &&
      Array.isArray(maybePost.hashtags) &&
      maybePost.hashtags.every((tag) => typeof tag === 'string')
    );
  }

  private isAnalystOutput(value: unknown): value is AnalystAgentOutput {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const maybeValue = value as Partial<AnalystAgentOutput>;

    return (
      typeof maybeValue.bestPost === 'number' &&
      typeof maybeValue.reason === 'string' &&
      Array.isArray(maybeValue.suggestions) &&
      maybeValue.suggestions.every((item) => typeof item === 'string') &&
      typeof maybeValue.positioning === 'string'
    );
  }
}
