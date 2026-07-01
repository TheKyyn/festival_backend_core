import request from 'supertest'
import { describe, expect, it } from 'vitest'
import type { Express } from 'express'

import { buildContainer, toAppDependencies, type Container } from '../../src/main/container'
import { createApp } from '../../src/interface/http/app'
import { loadEnv } from '../../src/infrastructure/config/env'
import { Slot } from '../../src/domain/entities/Slot'
import { Reservation } from '../../src/domain/entities/Reservation'
import { ReservationStatus } from '../../src/domain/value-objects/ReservationStatus'
import { User } from '../../src/domain/entities/User'
import { Email } from '../../src/domain/value-objects/Email'
import { Role } from '../../src/domain/value-objects/Role'

function setup(): { app: Express; container: Container } {
  const container = buildContainer({ ...loadEnv(), bcryptRounds: 4 })
  return { app: createApp(toAppDependencies(container)), container }
}

function futureSlot(id: string): Slot {
  return new Slot({
    id,
    eventId: 'event-1',
    startTime: new Date('2100-06-01T10:00:00.000Z'),
    endTime: new Date('2100-06-01T12:00:00.000Z'),
    capacity: 5,
  })
}

async function registerAndLogin(
  app: Express,
  email: string,
): Promise<{ token: string; userId: string }> {
  const credentials = { email, password: 'Password123!' }
  await request(app).post('/api/auth/register').send(credentials)
  const login = await request(app).post('/api/auth/login').send(credentials)
  return { token: login.body.accessToken, userId: login.body.user.id }
}

async function seedStaff(container: Container): Promise<void> {
  const passwordHash = await container.passwordHasher.hash('Staff123!')
  await container.users.save(
    new User({
      id: 'staff-1',
      email: Email.create('staff@festival.fr'),
      passwordHash,
      role: Role.STAFF,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    }),
  )
}

describe('Routes de réservation', () => {
  it('POST /api/reservations sans token -> 401', async () => {
    const { app } = setup()

    const res = await request(app).post('/api/reservations').send({ slotId: 'slot-1' })

    expect(res.status).toBe(401)
  })

  it('POST /api/reservations avec token -> 201', async () => {
    const { app, container } = setup()
    await container.slots.save(futureSlot('slot-1'))
    const { token } = await registerAndLogin(app, 'visiteur@festival.fr')

    const res = await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${token}`)
      .send({ slotId: 'slot-1' })

    expect(res.status).toBe(201)
    expect(res.body.slotId).toBe('slot-1')
    expect(res.body.status).toBe('PENDING')
  })

  it('GET /api/reservations/me renvoie les réservations de l utilisateur', async () => {
    const { app, container } = setup()
    await container.slots.save(futureSlot('slot-1'))
    const { token } = await registerAndLogin(app, 'visiteur@festival.fr')
    await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${token}`)
      .send({ slotId: 'slot-1' })

    const res = await request(app).get('/api/reservations/me').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].slotId).toBe('slot-1')
  })

  it('DELETE la réservation d un autre utilisateur -> 403', async () => {
    const { app, container } = setup()
    await container.reservations.save(
      new Reservation({
        id: 'res-1',
        userId: 'someone-else',
        slotId: 'slot-1',
        status: ReservationStatus.PENDING,
        createdAt: new Date('2026-01-01T10:00:00.000Z'),
      }),
    )
    const { token } = await registerAndLogin(app, 'autre@festival.fr')

    const res = await request(app).delete('/api/reservations/res-1').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(403)
  })

  it('DELETE par le propriétaire annule la réservation (statut CANCELLED)', async () => {
    const { app, container } = setup()
    const { token, userId } = await registerAndLogin(app, 'visiteur@festival.fr')
    await container.reservations.save(
      new Reservation({
        id: 'res-1',
        userId,
        slotId: 'slot-1',
        status: ReservationStatus.PENDING,
        createdAt: new Date('2026-01-01T10:00:00.000Z'),
      }),
    )

    const res = await request(app).delete('/api/reservations/res-1').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('CANCELLED')
  })

  it('POST /api/reservations/:id/validate avec un VISITOR -> 403', async () => {
    const { app, container } = setup()
    await container.reservations.save(
      new Reservation({
        id: 'res-1',
        userId: 'someone',
        slotId: 'slot-1',
        status: ReservationStatus.PENDING,
        createdAt: new Date('2026-01-01T10:00:00.000Z'),
      }),
    )
    const { token } = await registerAndLogin(app, 'visiteur@festival.fr')

    const res = await request(app)
      .post('/api/reservations/res-1/validate')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(403)
  })

  it('POST /api/reservations/:id/validate avec un STAFF -> 200 (CONFIRMED)', async () => {
    const { app, container } = setup()
    await seedStaff(container)
    await container.reservations.save(
      new Reservation({
        id: 'res-1',
        userId: 'someone',
        slotId: 'slot-1',
        status: ReservationStatus.PENDING,
        createdAt: new Date('2026-01-01T10:00:00.000Z'),
      }),
    )
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'staff@festival.fr', password: 'Staff123!' })

    const res = await request(app)
      .post('/api/reservations/res-1/validate')
      .set('Authorization', `Bearer ${login.body.accessToken}`)

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('CONFIRMED')
  })
})
