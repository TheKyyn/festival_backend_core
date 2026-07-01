import type { Slot } from '../../../domain/entities/Slot'
import type { SlotRepository } from '../../../domain/repositories/SlotRepository'

/**
 * Adapter de persistance en mémoire du SlotRepository.
 * Utilisé pour le développement local (avant Prisma) et par les tests.
 */
export class InMemorySlotRepository implements SlotRepository {
  private readonly slots = new Map<string, Slot>()

  constructor(initial: Slot[] = []) {
    for (const slot of initial) this.slots.set(slot.id, slot)
  }

  async findById(id: string): Promise<Slot | null> {
    return this.slots.get(id) ?? null
  }

  async findByIds(ids: string[]): Promise<Slot[]> {
    return ids
      .map((id) => this.slots.get(id))
      .filter((slot): slot is Slot => slot !== undefined)
  }

  async findByEventId(eventId: string): Promise<Slot[]> {
    return [...this.slots.values()].filter((slot) => slot.eventId === eventId)
  }

  async save(slot: Slot): Promise<void> {
    this.slots.set(slot.id, slot)
  }
}
