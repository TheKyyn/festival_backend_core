import type { Reservation } from '../../../domain/entities/Reservation'
import type { ReservationRepository } from '../../../domain/repositories/ReservationRepository'

/**
 * Adapter de persistance en mémoire du ReservationRepository.
 * Utilisé pour le développement local (avant Prisma) et par les tests.
 */
export class InMemoryReservationRepository implements ReservationRepository {
  private readonly reservations = new Map<string, Reservation>()

  constructor(initial: Reservation[] = []) {
    for (const reservation of initial) this.reservations.set(reservation.id, reservation)
  }

  async findById(id: string): Promise<Reservation | null> {
    return this.reservations.get(id) ?? null
  }

  async countActiveBySlot(slotId: string): Promise<number> {
    return [...this.reservations.values()].filter(
      (reservation) => reservation.slotId === slotId && reservation.isActive(),
    ).length
  }

  async findActiveByUser(userId: string): Promise<Reservation[]> {
    return [...this.reservations.values()].filter(
      (reservation) => reservation.userId === userId && reservation.isActive(),
    )
  }

  async save(reservation: Reservation): Promise<void> {
    this.reservations.set(reservation.id, reservation)
  }
}
