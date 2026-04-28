/* eslint-disable @typescript-eslint/require-await */
import { Injectable } from '@nestjs/common';
import { ChatTool } from './index';

@Injectable()
export class DatabaseTool implements ChatTool {
  readonly name = 'database';

  async execute(input: unknown): Promise<unknown> {
    // TODO: Implement database lookup/query tool invocation.
    void input;
    return null;
  }

  async getOrders({
    clientId,
    dateFrom,
  }: { clientId?: string; dateFrom?: string } = {}): Promise<unknown[]> {
    void clientId;
    void dateFrom;
    return [
      {
        id: 'ord-001',
        clientId: 'cli-1',
        date: '2026-01-10',
        amount: 1500,
        status: 'delivered',
      },
      {
        id: 'ord-002',
        clientId: 'cli-2',
        date: '2026-02-05',
        amount: 320,
        status: 'pending',
      },
      {
        id: 'ord-003',
        clientId: 'cli-3',
        date: '2026-03-01',
        amount: 870,
        status: 'processing',
      },
    ];
  }

  async getClients({ city }: { city?: string } = {}): Promise<unknown[]> {
    void city;
    return [
      {
        id: 'cli-1',
        name: 'Олена Коваль',
        city: 'Київ',
        email: 'olena@example.com',
      },
      {
        id: 'cli-2',
        name: 'Максим Бондар',
        city: 'Львів',
        email: 'maksym@example.com',
      },
      {
        id: 'cli-3',
        name: 'Софія Мельник',
        city: 'Одеса',
        email: 'sofia@example.com',
      },
    ];
  }
}
