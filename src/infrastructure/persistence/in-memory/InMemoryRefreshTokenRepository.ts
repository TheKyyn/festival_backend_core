import type { RefreshToken } from '../../../domain/entities/RefreshToken'
import type { RefreshTokenRepository } from '../../../domain/repositories/RefreshTokenRepository'

/** Adapter de persistance en mémoire du RefreshTokenRepository. */
export class InMemoryRefreshTokenRepository implements RefreshTokenRepository {
  private readonly tokens = new Map<string, RefreshToken>()

  constructor(initial: RefreshToken[] = []) {
    for (const token of initial) this.tokens.set(token.id, token)
  }

  async findByHash(tokenHash: string): Promise<RefreshToken | null> {
    return [...this.tokens.values()].find((token) => token.tokenHash === tokenHash) ?? null
  }

  async save(token: RefreshToken): Promise<void> {
    this.tokens.set(token.id, token)
  }

  async consume(tokenHash: string, now: Date): Promise<RefreshToken | null> {
    const token = [...this.tokens.values()].find((t) => t.tokenHash === tokenHash)
    if (!token || !token.isActive(now)) {
      return null
    }
    const revoked = token.revoke(now)
    this.tokens.set(revoked.id, revoked)
    return revoked
  }
}
