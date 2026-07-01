import type { Venue } from '../entities/Venue'

/** Port de persistance des lieux. */
export interface VenueRepository {
  findById(id: string): Promise<Venue | null>
  save(venue: Venue): Promise<void>
}
