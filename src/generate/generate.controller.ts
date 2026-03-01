import { Body, Controller, Post } from '@nestjs/common';
import { GenerateService } from './generate.service';

@Controller('generate')
export class GenerateController {
  constructor(private readonly generateService: GenerateService) {}

  @Post()
  generate(@Body() body: { topic: string }) {
    return this.generateService.generateFromTopic(body.topic ?? '');
  }
}
