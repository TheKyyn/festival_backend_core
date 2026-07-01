import type { RefreshTokenRepository } from '../../../domain/repositories/RefreshTokenRepository'
import type { RefreshTokenService } from '../../ports/RefreshTokenService'
import type { Clock } from '../../ports/Clock'

export interface LogoutUserCommand {
  refreshToken: string
}

export interface LogoutUserDeps {
  refreshTokenRepo: RefreshTokenRepository
  refreshTokens: RefreshTokenService
  clock: Clock
}

/**
 * Déconnexion : révoque le refresh token présenté. Idempotent — aucune erreur
 * si le token est déjà révoqué ou introuvable.
 */
export class LogoutUser {
  constructor(private readonly deps: LogoutUserDeps) {}

  async execute(command: LogoutUserCommand): Promise<void> {
    const { refreshTokenRepo, refreshTokens, clock } = this.deps

    const tokenHash = refreshTokens.hash(command.refreshToken)
    const stored = await refreshTokenRepo.findByHash(tokenHash)
    const now = clock.now()

    if (stored && stored.isActive(now)) {
      await refreshTokenRepo.save(stored.revoke(now))
    }
  }
}
