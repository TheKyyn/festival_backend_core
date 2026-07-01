import type { Slot as PrismaSlot } from '@prisma/client'

import { Slot } from '../../../../domain/entities/Slot'
import { Role } from '../../../../domain/value-objects/Role'

/** Modèle de persistance -> entité domaine. */
export function toDomainSlot(row: PrismaSlot): Slot {
  return new Slot({
    id: row.id,
    eventId: row.eventId,
    startTime: row.startTime,
    endTime: row.endTime,
    capacity: row.capacity,
    allowedRoles: row.allowedRoles.map((name) => Role.fromString(name)),
  })
}

/** Entité domaine -> données de persistance. */
export function toPersistenceSlot(slot: Slot): PrismaSlot {
  return {
    id: slot.id,
    eventId: slot.eventId,
    startTime: slot.startTime,
    endTime: slot.endTime,
    capacity: slot.capacity,
    allowedRoles: slot.allowedRoles.map((role) => role.name),
  }
}
