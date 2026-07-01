import type { PrismaClient } from '@prisma/client'

import type { Slot } from '../../../../domain/entities/Slot'
import type { SlotRepository } from '../../../../domain/repositories/SlotRepository'
import { toDomainSlot, toPersistenceSlot } from '../mappers/slotMapper'

export class PrismaSlotRepository implements SlotRepository {
  constructor(private readonly client: PrismaClient) {}

  async findById(id: string): Promise<Slot | null> {
    const row = await this.client.slot.findUnique({ where: { id } })
    return row ? toDomainSlot(row) : null
  }

  async findByIds(ids: string[]): Promise<Slot[]> {
    const rows = await this.client.slot.findMany({ where: { id: { in: ids } } })
    return rows.map(toDomainSlot)
  }

  async findByEventId(eventId: string): Promise<Slot[]> {
    const rows = await this.client.slot.findMany({ where: { eventId } })
    return rows.map(toDomainSlot)
  }

  async save(slot: Slot): Promise<void> {
    const data = toPersistenceSlot(slot)
    await this.client.slot.upsert({ where: { id: slot.id }, create: data, update: data })
  }
}
