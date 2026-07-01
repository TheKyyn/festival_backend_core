import request from 'supertest'
import { describe, expect, it } from 'vitest'

import { buildContainer, toAppDependencies } from '../../src/main/container'
import { createApp } from '../../src/interface/http/app'
import { loadEnv } from '../../src/infrastructure/config/env'
import { User } from '../../src/domain/entities/User'
import { Email } from '../../src/domain/value-objects/Email'
import { Role } from '../../src/domain/value-objects/Role'

function makeContainer() {
  return buildContainer({ ...loadEnv(), bcryptRounds: 4 })
}

describe('Autorisation par rôle (GET /api/admin/ping, action MANAGE_USERS)', () => {
  it('401 sans token', async () => {
    const app = createApp(toAppDependencies(makeContainer()))

    const res = await request(app).get('/api/admin/ping')

    expect(res.status).toBe(401)
  })

  it('403 avec un token VISITOR', async () => {
    const container = makeContainer()
    const app = createApp(toAppDependencies(container))
    const creds = { email: 'visiteur@festival.fr', password: 'Visiteur123!' }
    await request(app).post('/api/auth/register').send(creds)
    const login = await request(app).post('/api/auth/login').send(creds)

    const res = await request(app)
      .get('/api/admin/ping')
      .set('Authorization', `Bearer ${login.body.accessToken}`)

    expect(res.status).toBe(403)
  })

  it('200 avec un token ADMIN', async () => {
    const container = makeContainer()
    const app = createApp(toAppDependencies(container))
    const passwordHash = await container.passwordHasher.hash('Admin123!')
    await container.users.save(
      new User({
        id: 'admin-1',
        email: Email.create('admin@festival.fr'),
        passwordHash,
        role: Role.ADMIN,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      }),
    )
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@festival.fr', password: 'Admin123!' })

    const res = await request(app)
      .get('/api/admin/ping')
      .set('Authorization', `Bearer ${login.body.accessToken}`)

    expect(res.status).toBe(200)
    expect(res.body.role).toBe('ADMIN')
  })
})
