import type { Event } from '../entities/Event'

/** Port de persistance des événements. */
export interface EventRepository {
  findById(id: string): Promise<Event | null>
  findAll(): Promise<Event[]>
  save(event: Event): Promise<void>
}
