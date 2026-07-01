import type { PrismaClient } from '@prisma/client'

import type { Event } from '../../../../domain/entities/Event'
import type { EventRepository } from '../../../../domain/repositories/EventRepository'
import { toDomainEvent, toPersistenceEvent } from '../mappers/eventMapper'

export class PrismaEventRepository implements EventRepository {
  constructor(private readonly client: PrismaClient) {}

  async findById(id: string): Promise<Event | null> {
    const row = await this.client.event.findUnique({ where: { id } })
    return row ? toDomainEvent(row) : null
  }

  async findAll(): Promise<Event[]> {
    const rows = await this.client.event.findMany()
    return rows.map(toDomainEvent)
  }

  async save(event: Event): Promise<void> {
    const data = toPersistenceEvent(event)
    await this.client.event.upsert({ where: { id: event.id }, create: data, update: data })
  }
}
