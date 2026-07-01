import { beforeEach, describe, expect, it } from 'vitest'

import { CreateSlot } from '../../../src/application/use-cases/catalog/CreateSlot'
import { Event } from '../../../src/domain/entities/Event'
import { Role } from '../../../src/domain/value-objects/Role'
import { AccessNotAllowedError, EventNotFoundError } from '../../../src/domain/errors/DomainErrors'
import { InMemorySlotRepository } from '../../../src/infrastructure/persistence/in-memory/InMemorySlotRepository'
import { InMemoryEventRepository } from '../../../src/infrastructure/persistence/in-memory/InMemoryEventRepository'
import { SequentialIdGenerator } from '../../fakes/SequentialIdGenerator'

const baseCommand = {
  eventId: 'event-1',
  startTime: new Date('2100-06-02T10:00:00.000Z'),
  endTime: new Date('2100-06-02T12:00:00.000Z'),
  capacity: 20,
}

describe('CreateSlot', () => {
  let slots: InMemorySlotRepository
  let events: InMemoryEventRepository
  let useCase: CreateSlot

  beforeEach(() => {
    slots = new InMemorySlotRepository()
    events = new InMemoryEventRepository([
      new Event({
        id: 'event-1',
        title: 'Expo',
        description: 'desc',
        venueId: 'venue-1',
        organizerId: 'org-1',
        startDate: new Date('2100-06-01T00:00:00.000Z'),
        endDate: new Date('2100-06-10T00:00:00.000Z'),
        createdAt: new Date('2026-01-01T10:00:00.000Z'),
      }),
    ])
    useCase = new CreateSlot({ slots, events, ids: new SequentialIdGenerator('slot') })
  })

  it('l organisateur propriétaire crée un créneau', async () => {
    const slot = await useCase.execute({
      ...baseCommand,
      actingUserId: 'org-1',
      actingUserRole: Role.ORGANIZER,
    })

    expect(slot.eventId).toBe('event-1')
    expect(slot.capacity).toBe(20)
    await expect(slots.findById(slot.id)).resolves.not.toBeNull()
  })

  it('un ADMIN peut créer un créneau sur tout événement', async () => {
    const slot = await useCase.execute({
      ...baseCommand,
      actingUserId: 'admin-1',
      actingUserRole: Role.ADMIN,
    })

    expect(slot.eventId).toBe('event-1')
  })

  it('refuse un événement introuvable', async () => {
    await expect(
      useCase.execute({
        ...baseCommand,
        eventId: 'unknown',
        actingUserId: 'org-1',
        actingUserRole: Role.ORGANIZER,
      }),
    ).rejects.toBeInstanceOf(EventNotFoundError)
  })

  it("refuse un ORGANIZER qui n'est pas le propriétaire de l'événement", async () => {
    await expect(
      useCase.execute({
        ...baseCommand,
        actingUserId: 'org-2',
        actingUserRole: Role.ORGANIZER,
      }),
    ).rejects.toBeInstanceOf(AccessNotAllowedError)
  })
})
