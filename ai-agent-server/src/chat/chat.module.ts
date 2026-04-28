import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { AnthropicService } from './anthropic.service';
import { DATABASE_TOOL } from './tools';

@Module({
  controllers: [ChatController],
  providers: [ChatService, AnthropicService, ...DATABASE_TOOL],
  exports: [ChatService],
})
export class ChatModule {}
