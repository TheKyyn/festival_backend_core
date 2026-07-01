import { CreateReservation } from '../application/use-cases/reservation/CreateReservation'
import { RegisterUser } from '../application/use-cases/auth/RegisterUser'
import { LoginUser } from '../application/use-cases/auth/LoginUser'
import { RefreshTokens } from '../application/use-cases/auth/RefreshTokens'
import { LogoutUser } from '../application/use-cases/auth/LogoutUser'
import { GetProfile } from '../application/use-cases/auth/GetProfile'
import type { AuthConfig } from '../application/use-cases/auth/AuthConfig'

import { InMemoryUserRepository } from '../infrastructure/persistence/in-memory/InMemoryUserRepository'
import { InMemorySlotRepository } from '../infrastructure/persistence/in-memory/InMemorySlotRepository'
import { InMemoryReservationRepository } from '../infrastructure/persistence/in-memory/InMemoryReservationRepository'
import { InMemoryRefreshTokenRepository } from '../infrastructure/persistence/in-memory/InMemoryRefreshTokenRepository'
import { BcryptPasswordHasher } from '../infrastructure/security/BcryptPasswordHasher'
import { JwtTokenService } from '../infrastructure/security/JwtTokenService'
import { CryptoRefreshTokenService } from '../infrastructure/security/CryptoRefreshTokenService'
import { SystemClock } from '../infrastructure/time/SystemClock'
import { UuidGenerator } from '../infrastructure/id/UuidGenerator'
import { loadEnv, type EnvConfig } from '../infrastructure/config/env'

import type { UserRepository } from '../domain/repositories/UserRepository'
import type { SlotRepository } from '../domain/repositories/SlotRepository'
import type { ReservationRepository } from '../domain/repositories/ReservationRepository'
import type { RefreshTokenRepository } from '../domain/repositories/RefreshTokenRepository'
import type { PasswordHasher } from '../application/ports/PasswordHasher'
import type { TokenService } from '../application/ports/TokenService'
import type { AppDependencies } from '../interface/http/AppDependencies'

export interface Container {
  users: UserRepository
  slots: SlotRepository
  reservations: ReservationRepository
  refreshTokenRepository: RefreshTokenRepository
  passwordHasher: PasswordHasher
  tokenService: TokenService
  createReservation: CreateReservation
  registerUser: RegisterUser
  loginUser: LoginUser
  refreshTokens: RefreshTokens
  logoutUser: LogoutUser
  getProfile: GetProfile
}

/**
 * Composition root : seul endroit qui instancie des dépendances concrètes.
 * Les repositories sont en mémoire pour l'instant ; ils seront remplacés par
 * les adapters Prisma sans modifier le domaine ni les use cases.
 */
export function buildContainer(env: EnvConfig = loadEnv()): Container {
  const users = new InMemoryUserRepository()
  const slots = new InMemorySlotRepository()
  const reservations = new InMemoryReservationRepository()
  const refreshTokenRepository = new InMemoryRefreshTokenRepository()

  const passwordHasher = new BcryptPasswordHasher(env.bcryptRounds)
  const tokenService = new JwtTokenService(env.jwtAccessSecret)
  const refreshTokenService = new CryptoRefreshTokenService()

  const clock = new SystemClock()
  const ids = new UuidGenerator()
  const authConfig: AuthConfig = {
    accessTokenTtl: env.accessTokenTtl,
    refreshTokenTtlMs: env.refreshTokenTtlMs,
  }

  const createReservation = new CreateReservation({ slots, reservations, clock, ids })
  const registerUser = new RegisterUser({ users, hasher: passwordHasher, ids, clock })
  const loginUser = new LoginUser({
    users,
    hasher: passwordHasher,
    tokens: tokenService,
    refreshTokens: refreshTokenService,
    refreshTokenRepo: refreshTokenRepository,
    ids,
    clock,
    config: authConfig,
  })
  const refreshTokens = new RefreshTokens({
    users,
    refreshTokenRepo: refreshTokenRepository,
    tokens: tokenService,
    refreshTokens: refreshTokenService,
    ids,
    clock,
    config: authConfig,
  })
  const logoutUser = new LogoutUser({
    refreshTokenRepo: refreshTokenRepository,
    refreshTokens: refreshTokenService,
    clock,
  })
  const getProfile = new GetProfile({ users })

  return {
    users,
    slots,
    reservations,
    refreshTokenRepository,
    passwordHasher,
    tokenService,
    createReservation,
    registerUser,
    loginUser,
    refreshTokens,
    logoutUser,
    getProfile,
  }
}

/** Extrait de quoi la couche HTTP a besoin à partir du conteneur. */
export function toAppDependencies(container: Container): AppDependencies {
  return {
    registerUser: container.registerUser,
    loginUser: container.loginUser,
    refreshTokens: container.refreshTokens,
    logoutUser: container.logoutUser,
    getProfile: container.getProfile,
    tokenService: container.tokenService,
  }
}
