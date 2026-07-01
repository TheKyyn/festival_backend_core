export type ReservationStatusName = 'PENDING' | 'CONFIRMED' | 'CANCELLED'

/**
 * Value Object : statut d'une réservation.
 * Centralise la notion de réservation "active" (qui occupe une place).
 * Domaine pur.
 */
export class ReservationStatus {
  static readonly PENDING = new ReservationStatus('PENDING')
  static readonly CONFIRMED = new ReservationStatus('CONFIRMED')
  static readonly CANCELLED = new ReservationStatus('CANCELLED')

  private constructor(public readonly value: ReservationStatusName) {}

  /** Une réservation PENDING ou CONFIRMED occupe une place. */
  isActive(): boolean {
    return this.value === 'PENDING' || this.value === 'CONFIRMED'
  }

  equals(other: ReservationStatus): boolean {
    return this.value === other.value
  }

  static fromString(value: string): ReservationStatus {
    switch (value) {
      case 'PENDING':
        return ReservationStatus.PENDING
      case 'CONFIRMED':
        return ReservationStatus.CONFIRMED
      case 'CANCELLED':
        return ReservationStatus.CANCELLED
      default:
        throw new Error(`Statut de réservation invalide: ${value}`)
    }
  }
}
