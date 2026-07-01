import { beforeEach, describe, expect, it } from 'vitest'

import { ValidateReservation } from '../../../src/application/use-cases/reservation/ValidateReservation'
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

function reservation(id: string, status: ReservationStatus): Reservation {
  return new Reservation({ id, userId: 'user-1', slotId: 'slot-1', status, createdAt: NOW })
}

describe('ValidateReservation', () => {
  let reservations: InMemoryReservationRepository
  let useCase: ValidateReservation

  beforeEach(() => {
    reservations = new InMemoryReservationRepository()
    useCase = new ValidateReservation({ reservations })
  })

  it('le STAFF valide une réservation en attente (statut CONFIRMED)', async () => {
    await reservations.save(reservation('res-1', ReservationStatus.PENDING))

    const confirmed = await useCase.execute({ reservationId: 'res-1', actingUserRole: Role.STAFF })

    expect(confirmed.status.equals(ReservationStatus.CONFIRMED)).toBe(true)
    const stored = await reservations.findById('res-1')
    expect(stored?.status.equals(ReservationStatus.CONFIRMED)).toBe(true)
  })

  it('un VISITOR ne peut pas valider', async () => {
    await reservations.save(reservation('res-1', ReservationStatus.PENDING))

    await expect(
      useCase.execute({ reservationId: 'res-1', actingUserRole: Role.VISITOR }),
    ).rejects.toBeInstanceOf(AccessNotAllowedError)
  })

  it('échoue si la réservation est introuvable', async () => {
    await expect(
      useCase.execute({ reservationId: 'unknown', actingUserRole: Role.STAFF }),
    ).rejects.toBeInstanceOf(ReservationNotFoundError)
  })

  it('échoue si la réservation n est pas en attente (déjà confirmée)', async () => {
    await reservations.save(reservation('res-1', ReservationStatus.CONFIRMED))

    await expect(
      useCase.execute({ reservationId: 'res-1', actingUserRole: Role.STAFF }),
    ).rejects.toBeInstanceOf(InvalidReservationStateError)
  })
})
