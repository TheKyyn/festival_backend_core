import { Event } from '../../../domain/entities/Event'
import { InvalidEventDatesError, VenueNotFoundError } from '../../../domain/errors/DomainErrors'
import type { EventRepository } from '../../../domain/repositories/EventRepository'
import type { VenueRepository } from '../../../domain/repositories/VenueRepository'
import type { IdGenerator } from '../../ports/IdGenerator'
import type { Clock } from '../../ports/Clock'

export interface CreateEventCommand {
  title: string
  description: string
  venueId: string
  organizerId: string
  startDate: Date
  endDate: Date
}

export interface CreateEventDeps {
  events: EventRepository
  venues: VenueRepository
  ids: IdGenerator
  clock: Clock
}

/**
 * Création d'un événement. Règles : le lieu doit exister, la date de début doit
 * précéder la date de fin. L'organizerId est celui de l'utilisateur connecté
 * (fourni par la couche interface).
 */
export class CreateEvent {
  constructor(private readonly deps: CreateEventDeps) {}

  async execute(command: CreateEventCommand): Promise<Event> {
    const venue = await this.deps.venues.findById(command.venueId)
    if (!venue) {
      throw new VenueNotFoundError(command.venueId)
    }
    if (command.startDate.getTime() >= command.endDate.getTime()) {
      throw new InvalidEventDatesError()
    }

    const event = new Event({
      id: this.deps.ids.next(),
      title: command.title,
      description: command.description,
      venueId: command.venueId,
      organizerId: command.organizerId,
      startDate: command.startDate,
      endDate: command.endDate,
      createdAt: this.deps.clock.now(),
    })
    await this.deps.events.save(event)
    return event
  }
}
