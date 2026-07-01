import { AccessNotAllowedError, ReservationNotFoundError } from '../../../domain/errors/DomainErrors'
import { Role } from '../../../domain/value-objects/Role'
import type { Reservation } from '../../../domain/entities/Reservation'
import type { ReservationRepository } from '../../../domain/repositories/ReservationRepository'

export interface CancelReservationCommand {
  reservationId: string
  actingUserId: string
  actingUserRole: Role
}

export interface CancelReservationDeps {
  reservations: ReservationRepository
}

/**
 * Annulation d'une réservation. Seul le propriétaire ou un ADMIN peut annuler.
 * L'annulation est métier (statut CANCELLED), jamais une suppression physique.
 */
export class CancelReservation {
  constructor(private readonly deps: CancelReservationDeps) {}

  async execute(command: CancelReservationCommand): Promise<Reservation> {
    const { reservations } = this.deps

    const reservation = await reservations.findById(command.reservationId)
    if (!reservation) {
      throw new ReservationNotFoundError(command.reservationId)
    }

    const isOwner = reservation.userId === command.actingUserId
    const isAdmin = command.actingUserRole.equals(Role.ADMIN)
    if (!isOwner && !isAdmin) {
      throw new AccessNotAllowedError('Vous ne pouvez pas annuler cette réservation.')
    }

    const cancelled = reservation.cancel()
    await reservations.update(cancelled)
    return cancelled
  }
}
