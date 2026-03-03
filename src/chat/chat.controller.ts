import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { ChatService } from './chat.service';
import type {
  FollowUpRequest,
  FollowUpResponse,
} from '../generate/generate.types';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('followup')
  async followUp(
    @Body() body: Partial<FollowUpRequest>,
  ): Promise<FollowUpResponse> {
    if (!body.topic?.trim()) {
      throw new BadRequestException('Topic is required');
    }

    if (!body.platform) {
      throw new BadRequestException('Platform is required');
    }

    if (!body.userMessage?.trim()) {
      throw new BadRequestException('User message is required');
    }

    if (
      !body.team?.strategyName ||
      !body.team?.creatorName ||
      !body.team?.analystName
    ) {
      throw new BadRequestException('Team metadata is required');
    }

    return this.chatService.followUp({
      topic: body.topic.trim(),
      platform: body.platform,
      team: body.team,
      userMessage: body.userMessage.trim(),
      targetAgents:
        Array.isArray(body.targetAgents) && body.targetAgents.length > 0
          ? body.targetAgents
          : ['strategy', 'creator', 'analyst'],
      strategySummary: body.strategySummary || '',
      creatorSummary: body.creatorSummary || '',
      analystSummary: body.analystSummary || '',
      postTitles: Array.isArray(body.postTitles) ? body.postTitles : [],
      bestPost: typeof body.bestPost === 'number' ? body.bestPost : 1,
    });
  }
}
