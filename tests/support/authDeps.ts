import { InMemoryUserRepository } from '../../src/infrastructure/persistence/in-memory/InMemoryUserRepository'
import { InMemoryRefreshTokenRepository } from '../../src/infrastructure/persistence/in-memory/InMemoryRefreshTokenRepository'
import { CryptoRefreshTokenService } from '../../src/infrastructure/security/CryptoRefreshTokenService'
import { RegisterUser } from '../../src/application/use-cases/auth/RegisterUser'
import { LoginUser } from '../../src/application/use-cases/auth/LoginUser'
import { RefreshTokens } from '../../src/application/use-cases/auth/RefreshTokens'
import { LogoutUser } from '../../src/application/use-cases/auth/LogoutUser'
import { GetProfile } from '../../src/application/use-cases/auth/GetProfile'
import type { AuthConfig } from '../../src/application/use-cases/auth/AuthConfig'
import { FakePasswordHasher } from '../fakes/FakePasswordHasher'
import { FakeTokenService } from '../fakes/FakeTokenService'
import { FakeClock } from '../fakes/FakeClock'
import { SequentialIdGenerator } from '../fakes/SequentialIdGenerator'

/**
 * Assemble les use cases d'authentification avec des doublures rapides
 * (hasher et token factices) et le vrai service de refresh (crypto).
 */
export function makeAuthDeps(now: Date) {
  const users = new InMemoryUserRepository()
  const refreshTokenRepo = new InMemoryRefreshTokenRepository()
  const hasher = new FakePasswordHasher()
  const tokens = new FakeTokenService()
  const refreshTokens = new CryptoRefreshTokenService()
  const clock = new FakeClock(now)
  const ids = new SequentialIdGenerator('id')
  const config: AuthConfig = { accessTokenTtl: '15m', refreshTokenTtlMs: 7 * 24 * 3600 * 1000 }

  const registerUser = new RegisterUser({ users, hasher, ids, clock })
  const loginUser = new LoginUser({ users, hasher, tokens, refreshTokens, refreshTokenRepo, ids, clock, config })
  const refreshUseCase = new RefreshTokens({ users, refreshTokenRepo, tokens, refreshTokens, ids, clock, config })
  const logoutUser = new LogoutUser({ refreshTokenRepo, refreshTokens, clock })
  const getProfile = new GetProfile({ users })

  return {
    users,
    refreshTokenRepo,
    refreshTokens,
    registerUser,
    loginUser,
    refreshUseCase,
    logoutUser,
    getProfile,
  }
}
