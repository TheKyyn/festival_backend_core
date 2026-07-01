import request from 'supertest'
import { describe, expect, it } from 'vitest'

import { buildContainer, toAppDependencies } from '../../src/main/container'
import { createApp } from '../../src/interface/http/app'
import { loadEnv } from '../../src/infrastructure/config/env'

// bcryptRounds réduit pour accélérer les tests (sans changer l'algorithme).
function makeApp() {
  const container = buildContainer({ ...loadEnv(), bcryptRounds: 4 })
  return createApp(toAppDependencies(container))
}

const credentials = { email: 'visiteur@festival.fr', password: 'Visiteur123!' }

describe('Authentification (flux HTTP)', () => {
  it('inscription -> 201, utilisateur VISITOR sans hash de mot de passe', async () => {
    const app = makeApp()

    const res = await request(app).post('/api/auth/register').send(credentials)

    expect(res.status).toBe(201)
    expect(res.body.email).toBe(credentials.email)
    expect(res.body.role).toBe('VISITOR')
    expect(res.body.passwordHash).toBeUndefined()
  })

  it('inscription -> 400 si firstName n est pas une chaîne', async () => {
    const app = makeApp()

    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...credentials, firstName: 123 })

    expect(res.status).toBe(400)
  })

  it('connexion -> 200 avec accessToken et refreshToken', async () => {
    const app = makeApp()
    await request(app).post('/api/auth/register').send(credentials)

    const res = await request(app).post('/api/auth/login').send(credentials)

    expect(res.status).toBe(200)
    expect(typeof res.body.accessToken).toBe('string')
    expect(typeof res.body.refreshToken).toBe('string')
  })

  it('GET /me sans token -> 401', async () => {
    const app = makeApp()

    const res = await request(app).get('/api/auth/me')

    expect(res.status).toBe(401)
  })

  it('GET /me avec token -> 200', async () => {
    const app = makeApp()
    await request(app).post('/api/auth/register').send(credentials)
    const login = await request(app).post('/api/auth/login').send(credentials)

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${login.body.accessToken}`)

    expect(res.status).toBe(200)
    expect(res.body.email).toBe(credentials.email)
  })

  it('rotation : l ancien refresh token est refusé après un refresh', async () => {
    const app = makeApp()
    await request(app).post('/api/auth/register').send(credentials)
    const login = await request(app).post('/api/auth/login').send(credentials)
    const first = login.body.refreshToken

    const refreshed = await request(app).post('/api/auth/refresh').send({ refreshToken: first })
    expect(refreshed.status).toBe(200)
    expect(refreshed.body.refreshToken).not.toBe(first)

    const reuse = await request(app).post('/api/auth/refresh').send({ refreshToken: first })
    expect(reuse.status).toBe(401)
  })

  it('déconnexion : le refresh token n est plus utilisable', async () => {
    const app = makeApp()
    await request(app).post('/api/auth/register').send(credentials)
    const login = await request(app).post('/api/auth/login').send(credentials)
    const token = login.body.refreshToken

    const logout = await request(app).post('/api/auth/logout').send({ refreshToken: token })
    expect(logout.status).toBe(204)

    const refresh = await request(app).post('/api/auth/refresh').send({ refreshToken: token })
    expect(refresh.status).toBe(401)
  })
})
