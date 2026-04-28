import Anthropic from '@anthropic-ai/sdk';
import { Provider } from '@nestjs/common';
import { DatabaseTool } from './database.tool';

export interface ChatTool {
  readonly name: string;
  execute(input: unknown): Promise<unknown>;
}

export const DATABASE_TOOL: Provider[] = [DatabaseTool];

export * from './database.tool';

export const ANTHROPIC_TOOLS: Anthropic.Tool[] = [
  {
    name: 'get_orders',
    description:
      'Retrieve a list of orders, optionally filtered by client ID and/or start date.',
    input_schema: {
      type: 'object',
      properties: {
        clientId: {
          type: 'string',
          description: 'Filter orders by client ID.',
        },
        dateFrom: {
          type: 'string',
          description:
            'Return orders placed on or after this date (ISO 8601, e.g. 2026-01-01).',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_clients',
    description: 'Retrieve a list of clients, optionally filtered by city.',
    input_schema: {
      type: 'object',
      properties: {
        city: {
          type: 'string',
          description: 'Filter clients by city.',
        },
      },
      required: [],
    },
  },
];
