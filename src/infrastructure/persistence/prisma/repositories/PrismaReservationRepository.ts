import { Prisma, type PrismaClient } from '@prisma/client'

import {
  DuplicateReservationError,
  SlotFullError,
  SlotNotFoundError,
} from '../../../../domain/errors/DomainErrors'
import type { Reservation } from '../../../../domain/entities/Reservation'
import type { ReservationRepository } from '../../../../domain/repositories/ReservationRepository'
import { toDomainReservation, toPersistenceReservation } from '../mappers/reservationMapper'

const ACTIVE_STATUSES = ['PENDING', 'CONFIRMED']

export class PrismaReservationRepository implements ReservationRepository {
  constructor(private readonly client: PrismaClient) {}

  async findById(id: string): Promise<Reservation | null> {
    const row = await this.client.reservation.findUnique({ where: { id } })
    return row ? toDomainReservation(row) : null
  }

  async countActiveBySlot(slotId: string): Promise<number> {
    return this.client.reservation.count({
      where: { slotId, status: { in: ACTIVE_STATUSES } },
    })
  }

  async findActiveByUser(userId: string): Promise<Reservation[]> {
    const rows = await this.client.reservation.findMany({
      where: { userId, status: { in: ACTIVE_STATUSES } },
    })
    return rows.map(toDomainReservation)
  }

  async findByUser(userId: string): Promise<Reservation[]> {
    const rows = await this.client.reservation.findMany({ where: { userId } })
    return rows.map(toDomainReservation)
  }

  async update(reservation: Reservation): Promise<void> {
    await this.client.reservation.update({
      where: { id: reservation.id },
      data: { status: reservation.status.value },
    })
  }

  /**
   * Insère la réservation dans une transaction qui verrouille la ligne du créneau
   * (SELECT ... FOR UPDATE), afin de sérialiser les réservations concurrentes sur
   * le même créneau : le contrôle de capacité ne peut plus être contourné par une
   * course. Le doublon est intercepté via la contrainte d'unicité (userId, slotId).
   */
  async save(reservation: Reservation): Promise<void> {
    await this.client.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<Array<{ capacity: number }>>(
        Prisma.sql`SELECT "capacity" FROM "Slot" WHERE "id" = ${reservation.slotId} FOR UPDATE`,
      )
      const slotRow = rows[0]
      if (!slotRow) {
        throw new SlotNotFoundError(reservation.slotId)
      }

      const activeCount = await tx.reservation.count({
        where: { slotId: reservation.slotId, status: { in: ACTIVE_STATUSES } },
      })
      if (activeCount >= Number(slotRow.capacity)) {
        throw new SlotFullError(reservation.slotId)
      }

      try {
        await tx.reservation.create({ data: toPersistenceReservation(reservation) })
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          throw new DuplicateReservationError()
        }
        throw error
      }
    })
  }
}
