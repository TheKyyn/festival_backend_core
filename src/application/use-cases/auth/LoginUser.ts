import { InvalidCredentialsError } from '../../../domain/errors/DomainErrors'
import type { User } from '../../../domain/entities/User'
import type { UserRepository } from '../../../domain/repositories/UserRepository'
import type { RefreshTokenRepository } from '../../../domain/repositories/RefreshTokenRepository'
import type { PasswordHasher } from '../../ports/PasswordHasher'
import type { TokenService } from '../../ports/TokenService'
import type { RefreshTokenService } from '../../ports/RefreshTokenService'
import type { IdGenerator } from '../../ports/IdGenerator'
import type { Clock } from '../../ports/Clock'
import type { AuthConfig } from './AuthConfig'
import { issueTokens } from './issueTokens'

export interface LoginUserCommand {
  email: string
  password: string
}

export interface LoginUserResult {
  accessToken: string
  refreshToken: string
  user: User
}

export interface LoginUserDeps {
  users: UserRepository
  hasher: PasswordHasher
  tokens: TokenService
  refreshTokens: RefreshTokenService
  refreshTokenRepo: RefreshTokenRepository
  ids: IdGenerator
  clock: Clock
  config: AuthConfig
}

/**
 * Connexion : vérifie l'email et le mot de passe, puis émet un access token
 * et un refresh token. Une même erreur est renvoyée que l'email soit inconnu
 * ou le mot de passe faux, pour ne pas divulguer l'existence d'un compte.
 */
export class LoginUser {
  constructor(private readonly deps: LoginUserDeps) {}

  async execute(command: LoginUserCommand): Promise<LoginUserResult> {
    const { users, hasher } = this.deps

    const user = await users.findByEmail(command.email)
    if (!user) {
      throw new InvalidCredentialsError()
    }

    const passwordMatches = await hasher.compare(command.password, user.passwordHash)
    if (!passwordMatches) {
      throw new InvalidCredentialsError()
    }

    const { accessToken, refreshToken } = await issueTokens(user, this.deps)
    return { accessToken, refreshToken, user }
  }
}
