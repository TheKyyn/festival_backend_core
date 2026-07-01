import { EventNotFoundError } from '../../../domain/errors/DomainErrors'
import type { Slot } from '../../../domain/entities/Slot'
import type { EventRepository } from '../../../domain/repositories/EventRepository'
import type { SlotRepository } from '../../../domain/repositories/SlotRepository'

export interface GetEventSlotsCommand {
  eventId: string
}

export interface GetEventSlotsDeps {
  events: EventRepository
  slots: SlotRepository
}

/** Liste publique des créneaux d'un événement. 404 si l'événement n'existe pas. */
export class GetEventSlots {
  constructor(private readonly deps: GetEventSlotsDeps) {}

  async execute(command: GetEventSlotsCommand): Promise<Slot[]> {
    const event = await this.deps.events.findById(command.eventId)
    if (!event) {
      throw new EventNotFoundError(command.eventId)
    }
    return this.deps.slots.findByEventId(command.eventId)
  }
}
