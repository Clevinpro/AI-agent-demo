import {
  Body,
  Controller,
  MessageEvent,
  Post,
  Query,
  Sse,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { ChatService } from './chat.service';
import { ChatMessageDto } from './dto/chat-message.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  createMessage(@Body() dto: ChatMessageDto): { conversationId: string } {
    return this.chatService.sendMessage(dto);
  }

  @Sse('stream')
  stream(
    @Query('conversationId') conversationId: string,
  ): Observable<MessageEvent> {
    return this.chatService.stream(conversationId);
  }
}
