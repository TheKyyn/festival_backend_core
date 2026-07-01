import type { Venue } from '../../../domain/entities/Venue'

export interface VenueView {
  id: string
  name: string
  address: string
  capacity: number
}

export function toVenueView(venue: Venue): VenueView {
  return { id: venue.id, name: venue.name, address: venue.address, capacity: venue.capacity }
}
