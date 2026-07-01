import { beforeEach, describe, expect, it } from 'vitest'

import { CreateEvent } from '../../../src/application/use-cases/catalog/CreateEvent'
import { Venue } from '../../../src/domain/entities/Venue'
import { InvalidEventDatesError, VenueNotFoundError } from '../../../src/domain/errors/DomainErrors'
import { InMemoryEventRepository } from '../../../src/infrastructure/persistence/in-memory/InMemoryEventRepository'
import { InMemoryVenueRepository } from '../../../src/infrastructure/persistence/in-memory/InMemoryVenueRepository'
import { FakeClock } from '../../fakes/FakeClock'
import { SequentialIdGenerator } from '../../fakes/SequentialIdGenerator'

const NOW = new Date('2026-01-01T10:00:00.000Z')

const validCommand = {
  title: 'Expo',
  description: 'Une exposition',
  venueId: 'venue-1',
  organizerId: 'org-1',
  startDate: new Date('2026-06-01T00:00:00.000Z'),
  endDate: new Date('2026-06-10T00:00:00.000Z'),
}

describe('CreateEvent', () => {
  let events: InMemoryEventRepository
  let venues: InMemoryVenueRepository
  let useCase: CreateEvent

  beforeEach(() => {
    events = new InMemoryEventRepository()
    venues = new InMemoryVenueRepository([
      new Venue({ id: 'venue-1', name: 'MEP', address: 'Paris', capacity: 200 }),
    ])
    useCase = new CreateEvent({
      events,
      venues,
      ids: new SequentialIdGenerator('event'),
      clock: new FakeClock(NOW),
    })
  })

  it('crée un événement valide rattaché au lieu et à l organisateur', async () => {
    const event = await useCase.execute(validCommand)

    expect(event.venueId).toBe('venue-1')
    expect(event.organizerId).toBe('org-1')
    await expect(events.findById(event.id)).resolves.not.toBeNull()
  })

  it('refuse un lieu introuvable', async () => {
    await expect(
      useCase.execute({ ...validCommand, venueId: 'unknown' }),
    ).rejects.toBeInstanceOf(VenueNotFoundError)
  })

  it('refuse des dates incohérentes (début après fin)', async () => {
    await expect(
      useCase.execute({
        ...validCommand,
        startDate: new Date('2026-06-10T00:00:00.000Z'),
        endDate: new Date('2026-06-01T00:00:00.000Z'),
      }),
    ).rejects.toBeInstanceOf(InvalidEventDatesError)
  })
})
