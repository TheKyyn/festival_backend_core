import type { Event } from '../../../domain/entities/Event'
import type { EventRepository } from '../../../domain/repositories/EventRepository'

/**
 * Adapter de persistance en mémoire de l'EventRepository.
 * Utilisé pour le développement sans base et par les tests.
 */
export class InMemoryEventRepository implements EventRepository {
  private readonly events = new Map<string, Event>()

  constructor(initial: Event[] = []) {
    for (const event of initial) this.events.set(event.id, event)
  }

  async findById(id: string): Promise<Event | null> {
    return this.events.get(id) ?? null
  }

  async findAll(): Promise<Event[]> {
    return [...this.events.values()]
  }

  async save(event: Event): Promise<void> {
    this.events.set(event.id, event)
  }
}
