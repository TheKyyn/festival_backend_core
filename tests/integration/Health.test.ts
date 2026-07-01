import request from 'supertest'
import { describe, expect, it } from 'vitest'

import { createApp } from '../../src/interface/http/app'
import { buildContainer, toAppDependencies } from '../../src/main/container'

describe('GET /health', () => {
  it('répond 200 avec le statut ok', async () => {
    const app = createApp(toAppDependencies(buildContainer()))

    const response = await request(app).get('/health')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ status: 'ok' })
  })
})
