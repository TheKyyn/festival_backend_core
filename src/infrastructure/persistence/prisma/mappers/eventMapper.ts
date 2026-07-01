import type { Event as PrismaEvent } from '@prisma/client'

import { Event } from '../../../../domain/entities/Event'

/** Modèle de persistance -> entité domaine. */
export function toDomainEvent(row: PrismaEvent): Event {
  return new Event({
    id: row.id,
    title: row.title,
    description: row.description,
    venueId: row.venueId,
    organizerId: row.organizerId,
    startDate: row.startDate,
    endDate: row.endDate,
    createdAt: row.createdAt,
  })
}

/** Entité domaine -> données de persistance. */
export function toPersistenceEvent(event: Event): PrismaEvent {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    venueId: event.venueId,
    organizerId: event.organizerId,
    startDate: event.startDate,
    endDate: event.endDate,
    createdAt: event.createdAt,
  }
}
