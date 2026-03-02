import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { GenerateService, GenerateResponse } from './generate.service';
import type { GenerateRequest, SocialPlatform } from './generate.types';

const allowedPlatforms: SocialPlatform[] = [
  'LINKEDIN',
  'YOUTUBE',
  'FACEBOOK',
  'X',
  'INSTAGRAM',
  'THREADS',
];

@Controller('generate')
export class GenerateController {
  constructor(private readonly generateService: GenerateService) {}

  @Post()
  async generate(
    @Body() body: Partial<GenerateRequest>,
  ): Promise<GenerateResponse> {
    const topic = body?.topic?.trim();
    const platform = body?.platform;

    if (!topic) {
      throw new BadRequestException('Topic is required');
    }

    if (!platform || !allowedPlatforms.includes(platform)) {
      throw new BadRequestException('Valid platform is required');
    }

    return this.generateService.generateFromTopic({
      topic,
      platform,
      brandName: body.brandName?.trim() || '',
      audience: body.audience?.trim() || '',
      tone: body.tone?.trim() || '',
      ctaStyle: body.ctaStyle?.trim() || '',
    });
  }
}
