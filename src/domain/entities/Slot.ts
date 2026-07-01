import type { Role } from '../value-objects/Role'

export interface SlotProps {
  id: string
  eventId: string
  startTime: Date
  endTime: Date
  capacity: number
  /** Liste blanche des rôles autorisés. Vide/absente = créneau ouvert à tous. */
  allowedRoles?: Role[]
}

/**
 * Entité Slot (créneau réservable). Porte des règles métier pures :
 * créneau passé, accès réservé à certains profils, chevauchement horaire.
 * Placer ces règles ici garde le use case fin et les rend testables unitairement.
 */
export class Slot {
  readonly id: string
  readonly eventId: string
  readonly startTime: Date
  readonly endTime: Date
  readonly capacity: number
  readonly allowedRoles: Role[]

  constructor(props: SlotProps) {
    this.id = props.id
    this.eventId = props.eventId
    this.startTime = props.startTime
    this.endTime = props.endTime
    this.capacity = props.capacity
    this.allowedRoles = props.allowedRoles ?? []
  }

  /** Un créneau déjà commencé (ou passé) n'est plus réservable. */
  isInPast(now: Date): boolean {
    return this.startTime.getTime() <= now.getTime()
  }

  /**
   * Accès réservé à certains profils : liste blanche explicite.
   * Aucune restriction si `allowedRoles` est vide.
   */
  isAccessibleBy(role: Role): boolean {
    return this.allowedRoles.length === 0 || this.allowedRoles.some((r) => r.equals(role))
  }

  /** Deux créneaux se chevauchent-ils dans le temps ? (intervalles ouverts) */
  overlaps(other: Slot): boolean {
    return this.startTime < other.endTime && other.startTime < this.endTime
  }
}
