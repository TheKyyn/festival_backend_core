import { AccessNotAllowedError, ReservationNotFoundError } from '../../../domain/errors/DomainErrors'
import { can } from '../../../domain/policies/AccessPolicy'
import type { Role } from '../../../domain/value-objects/Role'
import type { Reservation } from '../../../domain/entities/Reservation'
import type { ReservationRepository } from '../../../domain/repositories/ReservationRepository'

export interface ValidateReservationCommand {
  reservationId: string
  actingUserRole: Role
}

export interface ValidateReservationDeps {
  reservations: ReservationRepository
}

/**
 * Validation (check-in) d'une réservation par le staff.
 * Réservée aux rôles autorisés pour l'action VALIDATE_RESERVATION.
 */
export class ValidateReservation {
  constructor(private readonly deps: ValidateReservationDeps) {}

  async execute(command: ValidateReservationCommand): Promise<Reservation> {
    const { reservations } = this.deps

    if (!can(command.actingUserRole, 'VALIDATE_RESERVATION')) {
      throw new AccessNotAllowedError('Votre rôle ne permet pas de valider une réservation.')
    }

    const reservation = await reservations.findById(command.reservationId)
    if (!reservation) {
      throw new ReservationNotFoundError(command.reservationId)
    }

    const confirmed = reservation.confirm()
    await reservations.update(confirmed)
    return confirmed
  }
}
