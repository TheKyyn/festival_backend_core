import { InvalidRefreshTokenError } from '../../../domain/errors/DomainErrors'
import type { User } from '../../../domain/entities/User'
import type { UserRepository } from '../../../domain/repositories/UserRepository'
import type { RefreshTokenRepository } from '../../../domain/repositories/RefreshTokenRepository'
import type { TokenService } from '../../ports/TokenService'
import type { RefreshTokenService } from '../../ports/RefreshTokenService'
import type { IdGenerator } from '../../ports/IdGenerator'
import type { Clock } from '../../ports/Clock'
import type { AuthConfig } from './AuthConfig'
import { issueTokens } from './issueTokens'

export interface RefreshTokensCommand {
  refreshToken: string
}

export interface RefreshTokensResult {
  accessToken: string
  refreshToken: string
  user: User
}

export interface RefreshTokensDeps {
  users: UserRepository
  refreshTokenRepo: RefreshTokenRepository
  tokens: TokenService
  refreshTokens: RefreshTokenService
  ids: IdGenerator
  clock: Clock
  config: AuthConfig
}

/**
 * Rafraîchissement avec ROTATION : valide le refresh token présenté, le révoque,
 * puis émet un nouveau couple access + refresh. Un token révoqué ou expiré est
 * refusé, ce qui invalide l'ancien token dès qu'il a servi une fois.
 */
export class RefreshTokens {
  constructor(private readonly deps: RefreshTokensDeps) {}

  async execute(command: RefreshTokensCommand): Promise<RefreshTokensResult> {
    const { users, refreshTokenRepo, refreshTokens, clock } = this.deps

    const tokenHash = refreshTokens.hash(command.refreshToken)

    // Consommation atomique : révoque le token seulement s'il est encore actif.
    // Si null, il a déjà été consommé/expiré → rejeu refusé.
    const consumed = await refreshTokenRepo.consume(tokenHash, clock.now())
    if (!consumed) {
      throw new InvalidRefreshTokenError()
    }

    const user = await users.findById(consumed.userId)
    if (!user) {
      throw new InvalidRefreshTokenError()
    }

    const { accessToken, refreshToken } = await issueTokens(user, this.deps)
    return { accessToken, refreshToken, user }
  }
}
