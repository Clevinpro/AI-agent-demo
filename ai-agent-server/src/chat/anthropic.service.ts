import Anthropic from '@anthropic-ai/sdk';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';
import { ANTHROPIC_TOOLS, DatabaseTool } from './tools';

@Injectable()
export class AnthropicService {
  private readonly client: Anthropic;

  constructor(
    private readonly db: DatabaseTool,
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');

    if (!apiKey) {
      throw new Error('Missing Anthropic credentials. Set ANTHROPIC_API_KEY.');
    }

    this.client = new Anthropic({ apiKey });
  }

  async sendMessage(message: string): Promise<string> {
    const messages: Anthropic.MessageParam[] = [
      { role: 'user', content: message },
    ];

    while (true) {
      const response = await this.client.messages.create({
        model: 'claude-opus-4-6',
        max_tokens: 4096,
        tools: ANTHROPIC_TOOLS,
        messages,
      });

      if (response.stop_reason === 'end_turn') {
        const textBlock = response.content.find(
          (b): b is Anthropic.TextBlock => b.type === 'text',
        );
        return textBlock?.text ?? '';
      }

      messages.push({ role: 'assistant', content: response.content });

      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const block of response.content) {
        if (block.type !== 'tool_use') continue;

        const input = block.input as Record<string, string | undefined>;
        let result: unknown;

        console.log(`[Tool call] ${block.name}`, input);

        if (block.name === 'get_orders') {
          result = await this.db.getOrders({
            clientId: input.clientId,
            dateFrom: input.dateFrom,
          });
        } else if (block.name === 'get_clients') {
          result = await this.db.getClients({ city: input.city });
        } else {
          result = { error: `Unknown tool: ${block.name}` };
        }

        console.log(`[Tool result] ${block.name}`, result);

        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: JSON.stringify(result),
        });
      }

      messages.push({ role: 'user', content: toolResults });
    }
  }

  streamMessage(message: string): Observable<string> {
    return new Observable<string>((subscriber) => {
      const messages: Anthropic.MessageParam[] = [
        { role: 'user', content: message },
      ];

      const run = async () => {
        while (true) {
          const stream = this.client.messages.stream({
            model: 'claude-opus-4-6',
            max_tokens: 4096,
            tools: ANTHROPIC_TOOLS,
            messages,
          });

          const toolResults: Anthropic.ToolResultBlockParam[] = [];
          let hasToolUse = false;

          for await (const event of stream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              subscriber.next(event.delta.text);
            }

            if (event.type === 'message_stop') {
              const finalMessage = await stream.finalMessage();

              if (finalMessage.stop_reason === 'end_turn') {
                return;
              }

              if (finalMessage.stop_reason === 'tool_use') {
                hasToolUse = true;
                messages.push({
                  role: 'assistant',
                  content: finalMessage.content,
                });

                for (const block of finalMessage.content) {
                  if (block.type !== 'tool_use') continue;

                  const input = block.input as Record<
                    string,
                    string | undefined
                  >;
                  let result: unknown;

                  console.log(`[Tool call] ${block.name}`, input);

                  if (block.name === 'get_orders') {
                    result = await this.db.getOrders({
                      clientId: input.clientId,
                      dateFrom: input.dateFrom,
                    });
                  } else if (block.name === 'get_clients') {
                    result = await this.db.getClients({ city: input.city });
                  } else {
                    result = { error: `Unknown tool: ${block.name}` };
                  }

                  console.log(`[Tool result] ${block.name}`, result);

                  toolResults.push({
                    type: 'tool_result',
                    tool_use_id: block.id,
                    content: JSON.stringify(result),
                  });
                }
              }
            }
          }

          if (!hasToolUse) return;
          messages.push({ role: 'user', content: toolResults });
        }
      };

      run()
        .then(() => subscriber.complete())
        .catch((err) => subscriber.error(err));
    });
  }
}
