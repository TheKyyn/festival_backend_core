import { Reservation } from '../../../domain/entities/Reservation'
import { ReservationPolicy } from '../../../domain/policies/ReservationPolicy'
import { can } from '../../../domain/policies/AccessPolicy'
import {
  AccessNotAllowedError,
  DuplicateReservationError,
  ReservationQuotaExceededError,
  ScheduleConflictError,
  SlotFullError,
  SlotInPastError,
  SlotNotFoundError,
} from '../../../domain/errors/DomainErrors'
import type { Role } from '../../../domain/value-objects/Role'
import type { SlotRepository } from '../../../domain/repositories/SlotRepository'
import type { ReservationRepository } from '../../../domain/repositories/ReservationRepository'
import type { Clock } from '../../ports/Clock'
import type { IdGenerator } from '../../ports/IdGenerator'

export interface CreateReservationCommand {
  userId: string
  userRole: Role
  slotId: string
}

export interface CreateReservationDeps {
  slots: SlotRepository
  reservations: ReservationRepository
  clock: Clock
  ids: IdGenerator
}

/**
 * Use case de création d'une réservation.
 * Applique les règles métier de réservation en ne dépendant que d'interfaces
 * (repositories du domaine + ports application). Aucun import d'Express, Prisma,
 * JWT ou bcrypt : il est donc testable sans base de données ni serveur HTTP.
 */
export class CreateReservation {
  constructor(private readonly deps: CreateReservationDeps) {}

  async execute(command: CreateReservationCommand): Promise<Reservation> {
    const { slots, reservations, clock, ids } = this.deps

    // 1. Le créneau doit exister.
    const slot = await slots.findById(command.slotId)
    if (!slot) {
      throw new SlotNotFoundError(command.slotId)
    }

    // 2. On ne réserve pas un créneau déjà commencé/passé.
    if (slot.isInPast(clock.now())) {
      throw new SlotInPastError(slot.id)
    }

    // 3a. Le rôle doit avoir l'autorisation d'effectuer l'action "réserver".
    if (!can(command.userRole, 'RESERVE')) {
      throw new AccessNotAllowedError("Votre rôle n'autorise pas la réservation.")
    }

    // 3b. Accès réservé à certains profils (liste blanche du créneau).
    if (!slot.isAccessibleBy(command.userRole)) {
      throw new AccessNotAllowedError('Ce créneau est réservé à certains profils.')
    }

    // On charge une seule fois les réservations actives de l'utilisateur + leurs
    // créneaux : ces données alimentent les règles doublon, quota et conflit.
    const activeReservations = await reservations.findActiveByUser(command.userId)
    const reservedSlots = await slots.findByIds(activeReservations.map((r) => r.slotId))

    // 4. Contrôle des doublons.
    const alreadyReserved = activeReservations.some((r) => r.slotId === slot.id)
    if (alreadyReserved) {
      throw new DuplicateReservationError()
    }

    // 5. Disponibilité des places / événement complet.
    // Le use case garde la règle métier lisible ; l'adapter Prisma renforce la
    // capacité en transaction avec verrou de ligne.
    const activeOnSlot = await reservations.countActiveBySlot(slot.id)
    if (activeOnSlot >= slot.capacity) {
      throw new SlotFullError(slot.id)
    }

    // 6. Quota global de réservations actives par utilisateur (tous événements confondus).
    if (activeReservations.length >= ReservationPolicy.MAX_ACTIVE_RESERVATIONS_PER_USER) {
      throw new ReservationQuotaExceededError(ReservationPolicy.MAX_ACTIVE_RESERVATIONS_PER_USER)
    }

    // 7. Horaires incompatibles (chevauchement avec une autre réservation active).
    const hasConflict = reservedSlots.some((s) => s.overlaps(slot))
    if (hasConflict) {
      throw new ScheduleConflictError()
    }

    // Toutes les règles passent : on crée la réservation en attente de validation.
    const reservation = Reservation.create({
      id: ids.next(),
      userId: command.userId,
      slotId: slot.id,
      now: clock.now(),
    })
    await reservations.save(reservation)
    return reservation
  }
}
