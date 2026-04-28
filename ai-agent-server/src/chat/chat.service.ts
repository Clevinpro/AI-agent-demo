import {
  BadRequestException,
  Injectable,
  Logger,
  MessageEvent,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { endWith, map, Observable, of } from 'rxjs';
import { AnthropicService } from './anthropic.service';
import { ChatMessageDto } from './dto/chat-message.dto';

@Injectable()
export class ChatService {
  private readonly pendingMessages = new Map<string, string>();
  private readonly logger = new Logger(ChatService.name);

  constructor(private readonly anthropicService: AnthropicService) {}

  sendMessage(dto: ChatMessageDto): { conversationId: string } {
    const conversationId = dto.conversationId ?? randomUUID();
    this.pendingMessages.set(conversationId, dto.message);

    return { conversationId };
  }

  stream(conversationId: string): Observable<MessageEvent> {
    if (!conversationId) {
      this.logger.warn('Missing conversationId in stream request.');
      throw new BadRequestException('conversationId is required.');
    }

    const message = this.pendingMessages.get(conversationId);

    if (!message) {
      // SSE clients can reconnect automatically, so the message may already be consumed.
      this.logger.warn(
        `No pending message for conversationId=${conversationId}; returning DONE.`,
      );
      return of({ data: '[DONE]' } as MessageEvent);
    }

    this.pendingMessages.delete(conversationId);

    return this.anthropicService.streamMessage(message).pipe(
      map((delta) => ({ data: JSON.stringify({ delta }) })),
      endWith({ data: '[DONE]' } as MessageEvent),
    );
  }
}
