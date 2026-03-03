import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RootModule } from './root/root.module';
import { HealthModule } from './health/health.module';
import { GenerateModule } from './generate/generate.module';
import { SystemModule } from './system/system.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    RootModule,
    HealthModule,
    GenerateModule,
    SystemModule,
    ChatModule,
  ],
})
export class AppModule {}
