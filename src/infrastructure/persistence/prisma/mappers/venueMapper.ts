import type { Venue as PrismaVenue } from '@prisma/client'

import { Venue } from '../../../../domain/entities/Venue'

/** Modèle de persistance -> entité domaine. */
export function toDomainVenue(row: PrismaVenue): Venue {
  return new Venue({ id: row.id, name: row.name, address: row.address, capacity: row.capacity })
}

/** Entité domaine -> données de persistance. */
export function toPersistenceVenue(venue: Venue): PrismaVenue {
  return { id: venue.id, name: venue.name, address: venue.address, capacity: venue.capacity }
}
