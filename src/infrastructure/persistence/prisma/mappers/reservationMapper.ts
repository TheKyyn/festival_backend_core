import type { Reservation as PrismaReservation } from '@prisma/client'

import { Reservation } from '../../../../domain/entities/Reservation'
import { ReservationStatus } from '../../../../domain/value-objects/ReservationStatus'

/** Modèle de persistance -> entité domaine. */
export function toDomainReservation(row: PrismaReservation): Reservation {
  return new Reservation({
    id: row.id,
    userId: row.userId,
    slotId: row.slotId,
    status: ReservationStatus.fromString(row.status),
    createdAt: row.createdAt,
  })
}

/** Entité domaine -> données de persistance. */
export function toPersistenceReservation(reservation: Reservation): PrismaReservation {
  return {
    id: reservation.id,
    userId: reservation.userId,
    slotId: reservation.slotId,
    status: reservation.status.value,
    createdAt: reservation.createdAt,
  }
}
