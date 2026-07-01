import type { PrismaClient } from '@prisma/client'

import type { Venue } from '../../../../domain/entities/Venue'
import type { VenueRepository } from '../../../../domain/repositories/VenueRepository'
import { toDomainVenue, toPersistenceVenue } from '../mappers/venueMapper'

export class PrismaVenueRepository implements VenueRepository {
  constructor(private readonly client: PrismaClient) {}

  async findById(id: string): Promise<Venue | null> {
    const row = await this.client.venue.findUnique({ where: { id } })
    return row ? toDomainVenue(row) : null
  }

  async save(venue: Venue): Promise<void> {
    const data = toPersistenceVenue(venue)
    await this.client.venue.upsert({ where: { id: venue.id }, create: data, update: data })
  }
}
