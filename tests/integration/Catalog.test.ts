import request from 'supertest'
import { describe, expect, it } from 'vitest'
import type { Express } from 'express'

import { buildContainer, toAppDependencies, type Container } from '../../src/main/container'
import { createApp } from '../../src/interface/http/app'
import { loadEnv } from '../../src/infrastructure/config/env'
import { User } from '../../src/domain/entities/User'
import { Email } from '../../src/domain/value-objects/Email'
import { Role } from '../../src/domain/value-objects/Role'

const PASSWORD = 'Password123!'

function setup(): { app: Express; container: Container } {
  const container = buildContainer({ ...loadEnv(), bcryptRounds: 4 })
  return { app: createApp(toAppDependencies(container)), container }
}

async function seedUser(container: Container, id: string, email: string, role: Role): Promise<void> {
  const passwordHash = await container.passwordHasher.hash(PASSWORD)
  await container.users.save(
    new User({ id, email: Email.create(email), passwordHash, role, createdAt: new Date('2026-01-01T00:00:00.000Z') }),
  )
}

async function login(app: Express, email: string): Promise<string> {
  const res = await request(app).post('/api/auth/login').send({ email, password: PASSWORD })
  return res.body.accessToken
}

async function createVenueAndEvent(app: Express, token: string): Promise<{ venueId: string; eventId: string }> {
  const venue = await request(app)
    .post('/api/venues')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'MEP', address: 'Paris', capacity: 200 })
  const event = await request(app)
    .post('/api/events')
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: 'Expo',
      description: 'desc',
      venueId: venue.body.id,
      startDate: '2100-06-01T00:00:00.000Z',
      endDate: '2100-06-30T00:00:00.000Z',
    })
  return { venueId: venue.body.id, eventId: event.body.id }
}

const SLOT_BODY = {
  startTime: '2100-06-10T10:00:00.000Z',
  endTime: '2100-06-10T12:00:00.000Z',
  capacity: 20,
}

describe('Catalogue (lieux / événements / créneaux)', () => {
  it('POST /api/venues sans token -> 401', async () => {
    const { app } = setup()

    const res = await request(app).post('/api/venues').send({ name: 'MEP', address: 'Paris', capacity: 200 })

    expect(res.status).toBe(401)
  })

  it('POST /api/venues avec un VISITOR -> 403', async () => {
    const { app, container } = setup()
    await seedUser(container, 'visitor-1', 'visitor@festival.fr', Role.VISITOR)
    const token = await login(app, 'visitor@festival.fr')

    const res = await request(app)
      .post('/api/venues')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'MEP', address: 'Paris', capacity: 200 })

    expect(res.status).toBe(403)
  })

  it('POST /api/venues avec un ORGANIZER -> 201', async () => {
    const { app, container } = setup()
    await seedUser(container, 'org-1', 'org@festival.fr', Role.ORGANIZER)
    const token = await login(app, 'org@festival.fr')

    const res = await request(app)
      .post('/api/venues')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'MEP', address: 'Paris', capacity: 200 })

    expect(res.status).toBe(201)
    expect(res.body.name).toBe('MEP')
  })

  it('POST /api/events avec un ORGANIZER -> 201', async () => {
    const { app, container } = setup()
    await seedUser(container, 'org-1', 'org@festival.fr', Role.ORGANIZER)
    const token = await login(app, 'org@festival.fr')
    const venue = await request(app)
      .post('/api/venues')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'MEP', address: 'Paris', capacity: 200 })

    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Expo',
        description: 'desc',
        venueId: venue.body.id,
        startDate: '2100-06-01T00:00:00.000Z',
        endDate: '2100-06-30T00:00:00.000Z',
      })

    expect(res.status).toBe(201)
    expect(res.body.organizerId).toBe('org-1')
  })

  it('POST /api/events/:id/slots par un autre ORGANIZER -> 403', async () => {
    const { app, container } = setup()
    await seedUser(container, 'org-1', 'org1@festival.fr', Role.ORGANIZER)
    await seedUser(container, 'org-2', 'org2@festival.fr', Role.ORGANIZER)
    const org1Token = await login(app, 'org1@festival.fr')
    const { eventId } = await createVenueAndEvent(app, org1Token)
    const org2Token = await login(app, 'org2@festival.fr')

    const res = await request(app)
      .post(`/api/events/${eventId}/slots`)
      .set('Authorization', `Bearer ${org2Token}`)
      .send(SLOT_BODY)

    expect(res.status).toBe(403)
  })

  it('POST /api/events/:id/slots par un ADMIN -> 201', async () => {
    const { app, container } = setup()
    await seedUser(container, 'org-1', 'org1@festival.fr', Role.ORGANIZER)
    await seedUser(container, 'admin-1', 'admin@festival.fr', Role.ADMIN)
    const org1Token = await login(app, 'org1@festival.fr')
    const { eventId } = await createVenueAndEvent(app, org1Token)
    const adminToken = await login(app, 'admin@festival.fr')

    const res = await request(app)
      .post(`/api/events/${eventId}/slots`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(SLOT_BODY)

    expect(res.status).toBe(201)
    expect(res.body.capacity).toBe(20)
  })

  it('GET /api/events est public -> 200', async () => {
    const { app } = setup()

    const res = await request(app).get('/api/events')

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  it('GET /api/events/:id/slots est public -> 200', async () => {
    const { app, container } = setup()
    await seedUser(container, 'org-1', 'org1@festival.fr', Role.ORGANIZER)
    const token = await login(app, 'org1@festival.fr')
    const { eventId } = await createVenueAndEvent(app, token)

    const res = await request(app).get(`/api/events/${eventId}/slots`)

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })
})
