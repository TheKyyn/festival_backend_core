import { describe, expect, it } from 'vitest'

import {
  toDomainRefreshToken,
  toPersistenceRefreshToken,
} from '../../../src/infrastructure/persistence/prisma/mappers/refreshTokenMapper'

const row = {
  id: 'rt-1',
  userId: 'user-1',
  tokenHash: 'sha256-hash',
  expiresAt: new Date('2026-01-08T10:00:00.000Z'),
  createdAt: new Date('2026-01-01T10:00:00.000Z'),
  revokedAt: null as Date | null,
}

describe('refreshTokenMapper', () => {
  it('convertit un modèle Prisma en entité domaine', () => {
    const token = toDomainRefreshToken(row)

    expect(token.id).toBe('rt-1')
    expect(token.userId).toBe('user-1')
    expect(token.tokenHash).toBe('sha256-hash')
    expect(token.revokedAt).toBeNull()
    expect(token.isActive(new Date('2026-01-02T10:00:00.000Z'))).toBe(true)
  })

  it('reconvertit une entité domaine en modèle de persistance (aller-retour)', () => {
    const token = toDomainRefreshToken(row)

    expect(toPersistenceRefreshToken(token)).toEqual(row)
  })
})
