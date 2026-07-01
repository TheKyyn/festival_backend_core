import type { Reservation } from '../../../domain/entities/Reservation'

export interface ReservationView {
  id: string
  userId: string
  slotId: string
  status: string
  createdAt: string
}

/** Projection publique d'une réservation. */
export function toReservationView(reservation: Reservation): ReservationView {
  return {
    id: reservation.id,
    userId: reservation.userId,
    slotId: reservation.slotId,
    status: reservation.status.value,
    createdAt: reservation.createdAt.toISOString(),
  }
}
