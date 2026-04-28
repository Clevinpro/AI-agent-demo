import { BadRequestException, MessageEvent } from '@nestjs/common';
import { lastValueFrom, of } from 'rxjs';
import { toArray } from 'rxjs/operators';
import { AnthropicService } from './anthropic.service';
import { ChatService } from './chat.service';

describe('ChatService', () => {
  let service: ChatService;
  let anthropicService: { streamMessage: jest.Mock };

  beforeEach(() => {
    anthropicService = {
      streamMessage: jest.fn(),
    };

    service = new ChatService(anthropicService as unknown as AnthropicService);
  });

  it('throws BadRequestException when conversationId is missing', () => {
    expect(() => service.stream('')).toThrow(BadRequestException);
    expect(() => service.stream('')).toThrow('conversationId is required.');
  });

  it('returns DONE event when no pending message exists', async () => {
    const loggerWarnSpy = jest.spyOn(
      (service as unknown as { logger: { warn: (msg: string) => void } })
        .logger,
      'warn',
    );

    const events = await lastValueFrom(
      service.stream('unknown-id').pipe(toArray()),
    );

    expect(events).toEqual([{ data: '[DONE]' }]);
    expect(loggerWarnSpy).toHaveBeenCalledWith(
      'No pending message for conversationId=unknown-id; returning DONE.',
    );
  });

  it('streams anthropic deltas and finishes with DONE', async () => {
    anthropicService.streamMessage.mockReturnValue(of('Hello', ' world'));

    const conversationId = 'conv-1';
    service.sendMessage({ conversationId, message: 'Hi' });

    const events = await lastValueFrom(
      service.stream(conversationId).pipe(toArray()),
    );

    expect(anthropicService.streamMessage).toHaveBeenCalledWith('Hi');
    expect(events).toEqual([
      { data: JSON.stringify({ delta: 'Hello' }) },
      { data: JSON.stringify({ delta: ' world' }) },
      { data: '[DONE]' },
    ]);
  });

  it('consumes pending message only once', async () => {
    anthropicService.streamMessage.mockReturnValue(of('Answer'));

    const conversationId = 'conv-once';
    service.sendMessage({ conversationId, message: 'Question' });

    await lastValueFrom(service.stream(conversationId).pipe(toArray()));
    const secondCallEvents = await lastValueFrom(
      service.stream(conversationId).pipe(toArray()),
    );

    expect(secondCallEvents).toEqual([{ data: '[DONE]' }]);
  });
});
