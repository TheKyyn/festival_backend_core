import { describe, expect, it } from 'vitest'

import { buildContainer } from '../../src/main/container'
import { Slot } from '../../src/domain/entities/Slot'
import { ReservationStatus } from '../../src/domain/value-objects/ReservationStatus'
import { Role } from '../../src/domain/value-objects/Role'

// Vérifie que le composition root câble correctement les adapters réels
// (SystemClock + UuidGenerator + repositories) autour du use case.
describe('buildContainer', () => {
  it('câble CreateReservation avec des adapters fonctionnels', async () => {
    const container = buildContainer()

    // Créneau volontairement très futur pour rester valide avec l'heure système.
    await container.slots.save(
      new Slot({
        id: 'slot-1',
        eventId: 'event-1',
        startTime: new Date('2100-06-01T10:00:00.000Z'),
        endTime: new Date('2100-06-01T12:00:00.000Z'),
        capacity: 5,
      }),
    )

    const reservation = await container.createReservation.execute({
      userId: 'user-1',
      userRole: Role.VISITOR,
      slotId: 'slot-1',
    })

    expect(reservation.slotId).toBe('slot-1')
    expect(reservation.status.equals(ReservationStatus.PENDING)).toBe(true)
    expect(reservation.id.length).toBeGreaterThan(0)
  })
})
