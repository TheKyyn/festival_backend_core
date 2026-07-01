import { Venue } from '../../../domain/entities/Venue'
import { InvalidVenueDataError } from '../../../domain/errors/DomainErrors'
import type { VenueRepository } from '../../../domain/repositories/VenueRepository'
import type { IdGenerator } from '../../ports/IdGenerator'

export interface CreateVenueCommand {
  name: string
  address: string
  capacity: number
}

export interface CreateVenueDeps {
  venues: VenueRepository
  ids: IdGenerator
}

/** Création d'un lieu. Règles : nom et adresse non vides, capacité strictement positive. */
export class CreateVenue {
  constructor(private readonly deps: CreateVenueDeps) {}

  async execute(command: CreateVenueCommand): Promise<Venue> {
    const name = command.name.trim()
    const address = command.address.trim()
    if (name === '' || address === '') {
      throw new InvalidVenueDataError("Le nom et l'adresse du lieu sont requis.")
    }
    if (!Number.isInteger(command.capacity) || command.capacity <= 0) {
      throw new InvalidVenueDataError('La capacité du lieu doit être un entier positif.')
    }

    const venue = new Venue({ id: this.deps.ids.next(), name, address, capacity: command.capacity })
    await this.deps.venues.save(venue)
    return venue
  }
}
