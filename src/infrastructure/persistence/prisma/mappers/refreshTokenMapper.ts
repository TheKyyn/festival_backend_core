import type { RefreshToken as PrismaRefreshToken } from '@prisma/client'

import { RefreshToken } from '../../../../domain/entities/RefreshToken'

/** Modèle de persistance -> entité domaine. */
export function toDomainRefreshToken(row: PrismaRefreshToken): RefreshToken {
  return new RefreshToken({
    id: row.id,
    userId: row.userId,
    tokenHash: row.tokenHash,
    expiresAt: row.expiresAt,
    createdAt: row.createdAt,
    revokedAt: row.revokedAt,
  })
}

/** Entité domaine -> données de persistance. */
export function toPersistenceRefreshToken(token: RefreshToken): PrismaRefreshToken {
  return {
    id: token.id,
    userId: token.userId,
    tokenHash: token.tokenHash,
    expiresAt: token.expiresAt,
    createdAt: token.createdAt,
    revokedAt: token.revokedAt,
  }
}
