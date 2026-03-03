import { Module } from '@nestjs/common';
import { GenerateController } from './generate.controller';
import { GenerateService } from './generate.service';
import { StrategyAgentService } from '../agents/strategy-agent.service';
import { ContentCreatorService } from '../agents/content-creator.service';
import { SocialAnalystService } from '../agents/social-analyst.service';

@Module({
  controllers: [GenerateController],
  providers: [
    GenerateService,
    StrategyAgentService,
    ContentCreatorService,
    SocialAnalystService,
  ],
})
export class GenerateModule {}
