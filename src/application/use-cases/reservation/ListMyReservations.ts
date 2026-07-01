import type { Reservation } from '../../../domain/entities/Reservation'
import type { ReservationRepository } from '../../../domain/repositories/ReservationRepository'

export interface ListMyReservationsCommand {
  userId: string
}

export interface ListMyReservationsDeps {
  reservations: ReservationRepository
}

/** Liste les réservations de l'utilisateur authentifié. */
export class ListMyReservations {
  constructor(private readonly deps: ListMyReservationsDeps) {}

  async execute(command: ListMyReservationsCommand): Promise<Reservation[]> {
    return this.deps.reservations.findByUser(command.userId)
  }
}
