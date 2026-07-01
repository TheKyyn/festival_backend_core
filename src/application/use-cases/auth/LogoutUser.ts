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

    // Révoque le token s'il est actif ; idempotent (consume renvoie null sinon).
    const tokenHash = refreshTokens.hash(command.refreshToken)
    await refreshTokenRepo.consume(tokenHash, clock.now())
  }
}
