import { beforeEach, describe, expect, it } from 'vitest'

import { CreateVenue } from '../../../src/application/use-cases/catalog/CreateVenue'
import { InvalidVenueDataError } from '../../../src/domain/errors/DomainErrors'
import { InMemoryVenueRepository } from '../../../src/infrastructure/persistence/in-memory/InMemoryVenueRepository'
import { SequentialIdGenerator } from '../../fakes/SequentialIdGenerator'

describe('CreateVenue', () => {
  let venues: InMemoryVenueRepository
  let useCase: CreateVenue

  beforeEach(() => {
    venues = new InMemoryVenueRepository()
    useCase = new CreateVenue({ venues, ids: new SequentialIdGenerator('venue') })
  })

  it('crée un lieu valide', async () => {
    const venue = await useCase.execute({ name: 'MEP', address: 'Paris', capacity: 200 })

    expect(venue.name).toBe('MEP')
    expect(venue.capacity).toBe(200)
    await expect(venues.findById(venue.id)).resolves.not.toBeNull()
  })

  it('refuse une capacité nulle ou négative', async () => {
    await expect(
      useCase.execute({ name: 'MEP', address: 'Paris', capacity: 0 }),
    ).rejects.toBeInstanceOf(InvalidVenueDataError)
  })

  it('refuse un nom vide', async () => {
    await expect(
      useCase.execute({ name: '   ', address: 'Paris', capacity: 10 }),
    ).rejects.toBeInstanceOf(InvalidVenueDataError)
  })
})
