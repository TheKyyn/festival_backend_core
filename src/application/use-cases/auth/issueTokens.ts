import { RefreshToken } from '../../../domain/entities/RefreshToken'
import type { User } from '../../../domain/entities/User'
import type { RefreshTokenRepository } from '../../../domain/repositories/RefreshTokenRepository'
import type { TokenService } from '../../ports/TokenService'
import type { RefreshTokenService } from '../../ports/RefreshTokenService'
import type { IdGenerator } from '../../ports/IdGenerator'
import type { Clock } from '../../ports/Clock'
import type { AuthConfig } from './AuthConfig'

export interface TokenIssuingDeps {
  tokens: TokenService
  refreshTokens: RefreshTokenService
  refreshTokenRepo: RefreshTokenRepository
  ids: IdGenerator
  clock: Clock
  config: AuthConfig
}

export interface IssuedTokens {
  accessToken: string
  refreshToken: string
}

/**
 * Émet un couple access token (JWT) + refresh token (aléatoire), et persiste
 * le refresh token sous forme hachée. Partagé par LoginUser et RefreshTokens.
 */
export async function issueTokens(user: User, deps: TokenIssuingDeps): Promise<IssuedTokens> {
  const accessToken = deps.tokens.sign({ sub: user.id, role: user.role.name }, deps.config.accessTokenTtl)

  const rawRefreshToken = deps.refreshTokens.generate()
  const tokenHash = deps.refreshTokens.hash(rawRefreshToken)
  const now = deps.clock.now()
  const expiresAt = new Date(now.getTime() + deps.config.refreshTokenTtlMs)

  const entity = RefreshToken.create({
    id: deps.ids.next(),
    userId: user.id,
    tokenHash,
    expiresAt,
    now,
  })
  await deps.refreshTokenRepo.save(entity)

  return { accessToken, refreshToken: rawRefreshToken }
}
