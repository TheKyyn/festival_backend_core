/**
 * Erreur métier de base. `code` est un identifiant STABLE et indépendant du HTTP.
 * La couche interface (Express) le traduira plus tard en statut (404, 403, 409...),
 * ce qui garde le domaine ignorant du protocole de transport.
 */
export abstract class DomainError extends Error {
  abstract readonly code: string

  constructor(message: string) {
    super(message)
    this.name = new.target.name
  }
}

export class SlotNotFoundError extends DomainError {
  readonly code = 'SLOT_NOT_FOUND'
  constructor(slotId: string) {
    super(`Créneau introuvable: ${slotId}`)
  }
}

export class SlotInPastError extends DomainError {
  readonly code = 'SLOT_IN_PAST'
  constructor(slotId: string) {
    super(`Le créneau ${slotId} est déjà commencé ou passé.`)
  }
}

export class AccessNotAllowedError extends DomainError {
  readonly code = 'ACCESS_NOT_ALLOWED'
  constructor(message = "Votre rôle ne permet pas d'accéder à ce créneau.") {
    super(message)
  }
}

export class DuplicateReservationError extends DomainError {
  readonly code = 'DUPLICATE_RESERVATION'
  constructor(message = 'Vous avez déjà une réservation active sur ce créneau.') {
    super(message)
  }
}

export class SlotFullError extends DomainError {
  readonly code = 'SLOT_FULL'
  constructor(slotId: string) {
    super(`Le créneau ${slotId} est complet.`)
  }
}

export class ReservationQuotaExceededError extends DomainError {
  readonly code = 'RESERVATION_QUOTA_EXCEEDED'
  constructor(max: number) {
    super(`Quota de réservations actives atteint (${max} par utilisateur).`)
  }
}

export class ScheduleConflictError extends DomainError {
  readonly code = 'SCHEDULE_CONFLICT'
  constructor(message = 'Ce créneau chevauche une autre de vos réservations actives.') {
    super(message)
  }
}

export class ReservationNotFoundError extends DomainError {
  readonly code = 'RESERVATION_NOT_FOUND'
  constructor(reservationId: string) {
    super(`Réservation introuvable: ${reservationId}`)
  }
}

export class InvalidReservationStateError extends DomainError {
  readonly code = 'INVALID_RESERVATION_STATE'
  constructor(message: string) {
    super(message)
  }
}

// --- Authentification ---

export class WeakPasswordError extends DomainError {
  readonly code = 'WEAK_PASSWORD'
  constructor(minLength: number) {
    super(`Le mot de passe doit contenir au moins ${minLength} caractères.`)
  }
}

export class EmailAlreadyInUseError extends DomainError {
  readonly code = 'EMAIL_ALREADY_IN_USE'
  constructor(message = 'Cet email est déjà utilisé.') {
    super(message)
  }
}

export class InvalidCredentialsError extends DomainError {
  readonly code = 'INVALID_CREDENTIALS'
  constructor(message = 'Identifiants invalides.') {
    super(message)
  }
}

export class InvalidRefreshTokenError extends DomainError {
  readonly code = 'INVALID_REFRESH_TOKEN'
  constructor(message = 'Refresh token invalide ou expiré.') {
    super(message)
  }
}

export class UserNotFoundError extends DomainError {
  readonly code = 'USER_NOT_FOUND'
  constructor(message = 'Utilisateur introuvable.') {
    super(message)
  }
}

// --- Catalogue (lieux / événements / créneaux) ---

export class VenueNotFoundError extends DomainError {
  readonly code = 'VENUE_NOT_FOUND'
  constructor(venueId: string) {
    super(`Lieu introuvable: ${venueId}`)
  }
}

export class EventNotFoundError extends DomainError {
  readonly code = 'EVENT_NOT_FOUND'
  constructor(eventId: string) {
    super(`Événement introuvable: ${eventId}`)
  }
}

export class InvalidVenueDataError extends DomainError {
  readonly code = 'INVALID_VENUE_DATA'
  constructor(message: string) {
    super(message)
  }
}

export class InvalidEventDatesError extends DomainError {
  readonly code = 'INVALID_EVENT_DATES'
  constructor(message = 'La date de début doit précéder la date de fin.') {
    super(message)
  }
}

export class InvalidSlotDatesError extends DomainError {
  readonly code = 'INVALID_SLOT_DATES'
  constructor(message: string) {
    super(message)
  }
}

export class InvalidSlotDataError extends DomainError {
  readonly code = 'INVALID_SLOT_DATA'
  constructor(message: string) {
    super(message)
  }
}
