import type { Event } from '../../../domain/entities/Event'
import type { EventRepository } from '../../../domain/repositories/EventRepository'

export interface ListEventsDeps {
  events: EventRepository
}

/** Liste publique des événements. */
export class ListEvents {
  constructor(private readonly deps: ListEventsDeps) {}

  async execute(): Promise<Event[]> {
    return this.deps.events.findAll()
  }
}
