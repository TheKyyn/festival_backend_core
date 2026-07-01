import { ReservationStatus } from '../value-objects/ReservationStatus'
import { InvalidReservationStateError } from '../errors/DomainErrors'

export interface ReservationProps {
  id: string
  userId: string
  slotId: string
  status: ReservationStatus
  createdAt: Date
}

/** Entité Reservation. Domaine pur. */
export class Reservation {
  readonly id: string
  readonly userId: string
  readonly slotId: string
  readonly status: ReservationStatus
  readonly createdAt: Date

  constructor(props: ReservationProps) {
    this.id = props.id
    this.userId = props.userId
    this.slotId = props.slotId
    this.status = props.status
    this.createdAt = props.createdAt
  }

  /** Fabrique une nouvelle réservation en attente de validation (PENDING). */
  static create(params: { id: string; userId: string; slotId: string; now: Date }): Reservation {
    return new Reservation({
      id: params.id,
      userId: params.userId,
      slotId: params.slotId,
      status: ReservationStatus.PENDING,
      createdAt: params.now,
    })
  }

  isActive(): boolean {
    return this.status.isActive()
  }

  private withStatus(status: ReservationStatus): Reservation {
    return new Reservation({
      id: this.id,
      userId: this.userId,
      slotId: this.slotId,
      status,
      createdAt: this.createdAt,
    })
  }

  /** Annulation métier : passe le statut à CANCELLED (jamais de suppression physique). */
  cancel(): Reservation {
    if (this.status.equals(ReservationStatus.CANCELLED)) {
      throw new InvalidReservationStateError('Cette réservation est déjà annulée.')
    }
    return this.withStatus(ReservationStatus.CANCELLED)
  }

  /** Validation (check-in) : seule une réservation en attente peut être confirmée. */
  confirm(): Reservation {
    if (!this.status.equals(ReservationStatus.PENDING)) {
      throw new InvalidReservationStateError('Seule une réservation en attente peut être validée.')
    }
    return this.withStatus(ReservationStatus.CONFIRMED)
  }
}
