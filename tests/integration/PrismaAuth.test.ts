import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { PrismaClient } from '@prisma/client'

import { buildPrismaContainer } from '../../src/main/prismaContainer'
import { toAppDependencies } from '../../src/main/container'
import { createApp } from '../../src/interface/http/app'
import { loadEnv } from '../../src/infrastructure/config/env'

// Ne s'exécute que sur demande explicite avec une base disponible :
//   docker compose up -d db && npx prisma db push && RUN_PRISMA_IT=1 npm test
const enabled = process.env.RUN_PRISMA_IT === '1'

describe.skipIf(!enabled)('Authentification sur PostgreSQL (Prisma)', () => {
  let prisma: PrismaClient
  let app: ReturnType<typeof createApp>

  const credentials = { email: 'prisma-visiteur@festival.fr', password: 'Visiteur123!' }

  beforeAll(() => {
    prisma = new PrismaClient()
    app = createApp(toAppDependencies(buildPrismaContainer(prisma, { ...loadEnv(), bcryptRounds: 4 })))
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  beforeEach(async () => {
    await prisma.refreshToken.deleteMany()
    await prisma.reservation.deleteMany()
    await prisma.user.deleteMany()
  })

  it('inscrit puis rejette un email déjà utilisé (contrainte @unique -> 409)', async () => {
    const first = await request(app).post('/api/auth/register').send(credentials)
    expect(first.status).toBe(201)

    const duplicate = await request(app).post('/api/auth/register').send(credentials)
    expect(duplicate.status).toBe(409)
  })

  it('connexion puis rotation : l ancien refresh token est refusé (401)', async () => {
    await request(app).post('/api/auth/register').send(credentials)
    const login = await request(app).post('/api/auth/login').send(credentials)
    expect(login.status).toBe(200)

    const first = login.body.refreshToken
    const refreshed = await request(app).post('/api/auth/refresh').send({ refreshToken: first })
    expect(refreshed.status).toBe(200)

    const reuse = await request(app).post('/api/auth/refresh').send({ refreshToken: first })
    expect(reuse.status).toBe(401)
  })
})
