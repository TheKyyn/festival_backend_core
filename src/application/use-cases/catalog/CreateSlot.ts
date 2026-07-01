import { Slot } from '../../../domain/entities/Slot'
import { Role } from '../../../domain/value-objects/Role'
import {
  AccessNotAllowedError,
  EventNotFoundError,
  InvalidSlotDataError,
  InvalidSlotDatesError,
} from '../../../domain/errors/DomainErrors'
import type { SlotRepository } from '../../../domain/repositories/SlotRepository'
import type { EventRepository } from '../../../domain/repositories/EventRepository'
import type { IdGenerator } from '../../ports/IdGenerator'

export interface CreateSlotCommand {
  eventId: string
  actingUserId: string
  actingUserRole: Role
  startTime: Date
  endTime: Date
  capacity: number
  allowedRoles?: Role[]
}

export interface CreateSlotDeps {
  slots: SlotRepository
  events: EventRepository
  ids: IdGenerator
}

/**
 * Ajout d'un créneau à un événement. L'ADMIN peut agir sur tout événement ;
 * l'ORGANIZER uniquement sur les siens. Règles : début avant fin, créneau dans
 * la période de l'événement, capacité strictement positive.
 */
export class CreateSlot {
  constructor(private readonly deps: CreateSlotDeps) {}

  async execute(command: CreateSlotCommand): Promise<Slot> {
    const event = await this.deps.events.findById(command.eventId)
    if (!event) {
      throw new EventNotFoundError(command.eventId)
    }

    // Autorisation par ressource : l'organisateur ne gère que ses propres événements.
    const isOwner = event.organizerId === command.actingUserId
    const isAdmin = command.actingUserRole.equals(Role.ADMIN)
    if (!isAdmin && !isOwner) {
      throw new AccessNotAllowedError("Vous ne pouvez ajouter un créneau qu'à vos propres événements.")
    }

    if (command.startTime.getTime() >= command.endTime.getTime()) {
      throw new InvalidSlotDatesError('Le début du créneau doit précéder sa fin.')
    }
    if (
      command.startTime.getTime() < event.startDate.getTime() ||
      command.endTime.getTime() > event.endDate.getTime()
    ) {
      throw new InvalidSlotDatesError("Le créneau doit se situer dans la période de l'événement.")
    }
    if (!Number.isInteger(command.capacity) || command.capacity <= 0) {
      throw new InvalidSlotDataError('La capacité du créneau doit être un entier positif.')
    }

    const slot = new Slot({
      id: this.deps.ids.next(),
      eventId: command.eventId,
      startTime: command.startTime,
      endTime: command.endTime,
      capacity: command.capacity,
      allowedRoles: command.allowedRoles,
    })
    await this.deps.slots.save(slot)
    return slot
  }
}
