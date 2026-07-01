import { ReservationStatus } from '../value-objects/ReservationStatus'

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
}
