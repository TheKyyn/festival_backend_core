import type { Venue } from '../../../domain/entities/Venue'
import type { VenueRepository } from '../../../domain/repositories/VenueRepository'

/** Adapter de persistance en mémoire du VenueRepository. */
export class InMemoryVenueRepository implements VenueRepository {
  private readonly venues = new Map<string, Venue>()

  constructor(initial: Venue[] = []) {
    for (const venue of initial) this.venues.set(venue.id, venue)
  }

  async findById(id: string): Promise<Venue | null> {
    return this.venues.get(id) ?? null
  }

  async save(venue: Venue): Promise<void> {
    this.venues.set(venue.id, venue)
  }
}
