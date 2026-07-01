import type { Reservation } from '../entities/Reservation'

/**
 * Port de persistance des réservations.
 * Les méthodes sont pensées pour les règles métier : disponibilité, doublon,
 * quota et conflit horaire. "Active" = statut PENDING ou CONFIRMED.
 */
export interface ReservationRepository {
  findById(id: string): Promise<Reservation | null>
  /** Nombre de réservations actives sur un créneau (toutes personnes confondues). */
  countActiveBySlot(slotId: string): Promise<number>
  /** Réservations actives d'un utilisateur (base des règles doublon/quota/conflit). */
  findActiveByUser(userId: string): Promise<Reservation[]>
  save(reservation: Reservation): Promise<void>
}
