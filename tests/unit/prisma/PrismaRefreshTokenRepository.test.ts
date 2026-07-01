import { describe, expect, it } from 'vitest'
import type { PrismaClient } from '@prisma/client'

import { PrismaRefreshTokenRepository } from '../../../src/infrastructure/persistence/prisma/repositories/PrismaRefreshTokenRepository'

describe('PrismaRefreshTokenRepository.consume', () => {
  it('renvoie null si aucune ligne active n a été révoquée (token déjà consommé/expiré)', async () => {
    const client = {
      refreshToken: {
        updateMany: async () => ({ count: 0 }),
        findUnique: async () => null,
      },
    } as unknown as PrismaClient

    const repository = new PrismaRefreshTokenRepository(client)

    const result = await repository.consume('hash', new Date('2026-01-01T10:00:00.000Z'))

    expect(result).toBeNull()
  })

  it('renvoie le token consommé quand la révocation conditionnelle a réussi', async () => {
    const row = {
      id: 'rt-1',
      userId: 'user-1',
      tokenHash: 'hash',
      expiresAt: new Date('2100-01-01T00:00:00.000Z'),
      createdAt: new Date('2026-01-01T10:00:00.000Z'),
      revokedAt: new Date('2026-01-01T10:00:00.000Z'),
    }
    const client = {
      refreshToken: {
        updateMany: async () => ({ count: 1 }),
        findUnique: async () => row,
      },
    } as unknown as PrismaClient

    const repository = new PrismaRefreshTokenRepository(client)

    const result = await repository.consume('hash', new Date('2026-01-01T10:00:00.000Z'))

    expect(result?.id).toBe('rt-1')
    expect(result?.userId).toBe('user-1')
  })
})
