import { beforeEach, describe, expect, it } from 'vitest'

import { CancelReservation } from '../../../src/application/use-cases/reservation/CancelReservation'
import { Reservation } from '../../../src/domain/entities/Reservation'
import { ReservationStatus } from '../../../src/domain/value-objects/ReservationStatus'
import { Role } from '../../../src/domain/value-objects/Role'
import {
  AccessNotAllowedError,
  InvalidReservationStateError,
  ReservationNotFoundError,
} from '../../../src/domain/errors/DomainErrors'
import { InMemoryReservationRepository } from '../../../src/infrastructure/persistence/in-memory/InMemoryReservationRepository'

const NOW = new Date('2026-01-01T10:00:00.000Z')

function pendingReservation(id: string, userId: string): Reservation {
  return new Reservation({ id, userId, slotId: 'slot-1', status: ReservationStatus.PENDING, createdAt: NOW })
}

describe('CancelReservation', () => {
  let reservations: InMemoryReservationRepository
  let useCase: CancelReservation

  beforeEach(() => {
    reservations = new InMemoryReservationRepository()
    useCase = new CancelReservation({ reservations })
  })

  it('le propriétaire annule sa réservation (statut CANCELLED, pas de suppression)', async () => {
    await reservations.save(pendingReservation('res-1', 'user-1'))

    const cancelled = await useCase.execute({
      reservationId: 'res-1',
      actingUserId: 'user-1',
      actingUserRole: Role.VISITOR,
    })

    expect(cancelled.status.equals(ReservationStatus.CANCELLED)).toBe(true)
    const stored = await reservations.findById('res-1')
    expect(stored?.status.equals(ReservationStatus.CANCELLED)).toBe(true)
  })

  it('un utilisateur non propriétaire (non ADMIN) ne peut pas annuler', async () => {
    await reservations.save(pendingReservation('res-1', 'user-1'))

    await expect(
      useCase.execute({ reservationId: 'res-1', actingUserId: 'user-2', actingUserRole: Role.VISITOR }),
    ).rejects.toBeInstanceOf(AccessNotAllowedError)
  })

  it('un ADMIN peut annuler la réservation d un autre utilisateur', async () => {
    await reservations.save(pendingReservation('res-1', 'user-1'))

    const cancelled = await useCase.execute({
      reservationId: 'res-1',
      actingUserId: 'admin-1',
      actingUserRole: Role.ADMIN,
    })

    expect(cancelled.status.equals(ReservationStatus.CANCELLED)).toBe(true)
  })

  it('échoue si la réservation est déjà annulée', async () => {
    await reservations.save(
      new Reservation({ id: 'res-1', userId: 'user-1', slotId: 'slot-1', status: ReservationStatus.CANCELLED, createdAt: NOW }),
    )

    await expect(
      useCase.execute({ reservationId: 'res-1', actingUserId: 'user-1', actingUserRole: Role.VISITOR }),
    ).rejects.toBeInstanceOf(InvalidReservationStateError)
  })

  it('échoue si la réservation est introuvable', async () => {
    await expect(
      useCase.execute({ reservationId: 'unknown', actingUserId: 'user-1', actingUserRole: Role.VISITOR }),
    ).rejects.toBeInstanceOf(ReservationNotFoundError)
  })
})
