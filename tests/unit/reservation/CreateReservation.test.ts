import { beforeEach, describe, expect, it } from 'vitest'

import { CreateReservation } from '../../../src/application/use-cases/reservation/CreateReservation'
import { Reservation } from '../../../src/domain/entities/Reservation'
import { Slot } from '../../../src/domain/entities/Slot'
import { ReservationStatus } from '../../../src/domain/value-objects/ReservationStatus'
import { Role } from '../../../src/domain/value-objects/Role'
import { ReservationPolicy } from '../../../src/domain/policies/ReservationPolicy'
import {
  AccessNotAllowedError,
  DuplicateReservationError,
  ReservationQuotaExceededError,
  ScheduleConflictError,
  SlotFullError,
  SlotInPastError,
  SlotNotFoundError,
} from '../../../src/domain/errors/DomainErrors'
import { InMemoryReservationRepository } from '../../../src/infrastructure/persistence/in-memory/InMemoryReservationRepository'
import { InMemorySlotRepository } from '../../../src/infrastructure/persistence/in-memory/InMemorySlotRepository'
import { FakeClock } from '../../fakes/FakeClock'
import { SequentialIdGenerator } from '../../fakes/SequentialIdGenerator'

// "Maintenant" figé : tous les créneaux de test sont dans le futur (juin 2026),
// sauf le créneau explicitement placé dans le passé.
const NOW = new Date('2026-01-01T10:00:00.000Z')

function makeSlot(
  id: string,
  opts: {
    eventId?: string
    start?: string
    end?: string
    capacity?: number
    allowedRoles?: Role[]
  } = {},
): Slot {
  return new Slot({
    id,
    eventId: opts.eventId ?? 'event-1',
    startTime: new Date(opts.start ?? '2026-06-01T10:00:00.000Z'),
    endTime: new Date(opts.end ?? '2026-06-01T12:00:00.000Z'),
    capacity: opts.capacity ?? 5,
    allowedRoles: opts.allowedRoles,
  })
}

function activeReservation(id: string, userId: string, slotId: string): Reservation {
  return new Reservation({
    id,
    userId,
    slotId,
    status: ReservationStatus.PENDING,
    createdAt: NOW,
  })
}

describe('CreateReservation', () => {
  let slots: InMemorySlotRepository
  let reservations: InMemoryReservationRepository
  let clock: FakeClock
  let ids: SequentialIdGenerator
  let useCase: CreateReservation

  beforeEach(() => {
    slots = new InMemorySlotRepository()
    reservations = new InMemoryReservationRepository()
    clock = new FakeClock(NOW)
    ids = new SequentialIdGenerator('res')
    useCase = new CreateReservation({ slots, reservations, clock, ids })
  })

  it('succès : crée une réservation quand toutes les règles sont respectées', async () => {
    await slots.save(makeSlot('slot-1', { capacity: 5 }))

    const reservation = await useCase.execute({
      userId: 'user-1',
      userRole: Role.VISITOR,
      slotId: 'slot-1',
    })

    expect(reservation.id).toBe('res-1')
    expect(reservation.userId).toBe('user-1')
    expect(reservation.slotId).toBe('slot-1')
    expect(reservation.status.equals(ReservationStatus.PENDING)).toBe(true)
    await expect(reservations.findById('res-1')).resolves.not.toBeNull()
  })

  it('échoue si le créneau est introuvable', async () => {
    await expect(
      useCase.execute({ userId: 'user-1', userRole: Role.VISITOR, slotId: 'unknown' }),
    ).rejects.toBeInstanceOf(SlotNotFoundError)
  })

  it('échoue si le créneau est déjà passé', async () => {
    await slots.save(
      makeSlot('slot-past', { start: '2025-12-01T10:00:00.000Z', end: '2025-12-01T12:00:00.000Z' }),
    )

    await expect(
      useCase.execute({ userId: 'user-1', userRole: Role.VISITOR, slotId: 'slot-past' }),
    ).rejects.toBeInstanceOf(SlotInPastError)
  })

  it("échoue si le rôle n'est pas autorisé pour ce créneau (accès réservé)", async () => {
    await slots.save(makeSlot('slot-restricted', { allowedRoles: [Role.STAFF] }))

    await expect(
      useCase.execute({ userId: 'user-1', userRole: Role.VISITOR, slotId: 'slot-restricted' }),
    ).rejects.toBeInstanceOf(AccessNotAllowedError)
  })

  it('échoue en cas de doublon de réservation', async () => {
    await slots.save(makeSlot('slot-1', { capacity: 5 }))
    await reservations.save(activeReservation('res-existing', 'user-1', 'slot-1'))

    await expect(
      useCase.execute({ userId: 'user-1', userRole: Role.VISITOR, slotId: 'slot-1' }),
    ).rejects.toBeInstanceOf(DuplicateReservationError)
  })

  it('échoue si le créneau est complet', async () => {
    await slots.save(makeSlot('slot-1', { capacity: 1 }))
    // Une autre personne occupe déjà l'unique place.
    await reservations.save(activeReservation('res-other', 'user-2', 'slot-1'))

    await expect(
      useCase.execute({ userId: 'user-1', userRole: Role.VISITOR, slotId: 'slot-1' }),
    ).rejects.toBeInstanceOf(SlotFullError)
  })

  it("échoue si le quota global de l'utilisateur est dépassé", async () => {
    // On remplit le quota global : MAX réservations actives sur des créneaux
    // futurs distincts et non chevauchants (indépendant de l'événement).
    const max = ReservationPolicy.MAX_ACTIVE_RESERVATIONS_PER_USER
    for (let i = 0; i < max; i++) {
      const hour = String(8 + i).padStart(2, '0')
      await slots.save(
        makeSlot(`slot-${i}`, {
          start: `2026-06-01T${hour}:00:00.000Z`,
          end: `2026-06-01T${hour}:30:00.000Z`,
        }),
      )
      await reservations.save(activeReservation(`r-${i}`, 'user-1', `slot-${i}`))
    }
    await slots.save(makeSlot('slot-target', { start: '2026-06-01T14:00:00.000Z', end: '2026-06-01T15:00:00.000Z' }))

    await expect(
      useCase.execute({ userId: 'user-1', userRole: Role.VISITOR, slotId: 'slot-target' }),
    ).rejects.toBeInstanceOf(ReservationQuotaExceededError)
  })

  it('échoue en cas de conflit horaire', async () => {
    await slots.save(makeSlot('slot-target', { start: '2026-06-01T10:00:00.000Z', end: '2026-06-01T12:00:00.000Z' }))
    await slots.save(makeSlot('slot-overlap', { start: '2026-06-01T11:00:00.000Z', end: '2026-06-01T13:00:00.000Z' }))
    await reservations.save(activeReservation('r1', 'user-1', 'slot-overlap'))

    await expect(
      useCase.execute({ userId: 'user-1', userRole: Role.VISITOR, slotId: 'slot-target' }),
    ).rejects.toBeInstanceOf(ScheduleConflictError)
  })
})
