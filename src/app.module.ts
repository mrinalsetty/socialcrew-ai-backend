import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './health/health.module';
import { GenerateModule } from './generate/generate.module';

@Module({
  imports: [HealthModule, GenerateModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
