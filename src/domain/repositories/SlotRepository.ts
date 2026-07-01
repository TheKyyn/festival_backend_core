import type { Slot } from '../entities/Slot'

/** Port de persistance des créneaux. */
export interface SlotRepository {
  findById(id: string): Promise<Slot | null>
  /** Charge plusieurs créneaux en une fois (évite le N+1 sur les règles de conflit). */
  findByIds(ids: string[]): Promise<Slot[]>
  findByEventId(eventId: string): Promise<Slot[]>
  save(slot: Slot): Promise<void>
}
