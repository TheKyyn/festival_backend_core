import type { PrismaClient } from '@prisma/client'

import type { RefreshToken } from '../../../../domain/entities/RefreshToken'
import type { RefreshTokenRepository } from '../../../../domain/repositories/RefreshTokenRepository'
import { toDomainRefreshToken, toPersistenceRefreshToken } from '../mappers/refreshTokenMapper'

export class PrismaRefreshTokenRepository implements RefreshTokenRepository {
  constructor(private readonly client: PrismaClient) {}

  async findByHash(tokenHash: string): Promise<RefreshToken | null> {
    const row = await this.client.refreshToken.findUnique({ where: { tokenHash } })
    return row ? toDomainRefreshToken(row) : null
  }

  async save(token: RefreshToken): Promise<void> {
    const data = toPersistenceRefreshToken(token)
    await this.client.refreshToken.upsert({ where: { id: token.id }, create: data, update: data })
  }

  async consume(tokenHash: string, now: Date): Promise<RefreshToken | null> {
    // Consommation atomique de l'ancien token : une seule requête met revokedAt à
    // jour si et seulement si le token est encore actif. count = 0 => rejeu refusé.
    // (L'émission du nouveau token est une opération distincte, hors transaction.)
    const result = await this.client.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null, expiresAt: { gt: now } },
      data: { revokedAt: now },
    })
    if (result.count === 0) {
      return null
    }
    const row = await this.client.refreshToken.findUnique({ where: { tokenHash } })
    return row ? toDomainRefreshToken(row) : null
  }
}
