import { describe, expect, it } from 'vitest'

import { makeAuthDeps } from '../../support/authDeps'
import { InvalidRefreshTokenError } from '../../../src/domain/errors/DomainErrors'

const NOW = new Date('2026-01-01T10:00:00.000Z')
const creds = { email: 'user@festival.fr', password: 'Secret123!' }

describe('LogoutUser', () => {
  it('révoque le refresh token présenté', async () => {
    const deps = makeAuthDeps(NOW)
    await deps.registerUser.execute(creds)
    const login = await deps.loginUser.execute(creds)

    await deps.logoutUser.execute({ refreshToken: login.refreshToken })

    await expect(
      deps.refreshUseCase.execute({ refreshToken: login.refreshToken }),
    ).rejects.toBeInstanceOf(InvalidRefreshTokenError)
  })

  it('est idempotent sur un token inconnu', async () => {
    const deps = makeAuthDeps(NOW)

    await expect(deps.logoutUser.execute({ refreshToken: 'inconnu' })).resolves.toBeUndefined()
  })
})
