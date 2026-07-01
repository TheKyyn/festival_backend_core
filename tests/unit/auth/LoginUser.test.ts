import { describe, expect, it } from 'vitest'

import { makeAuthDeps } from '../../support/authDeps'
import { InvalidCredentialsError } from '../../../src/domain/errors/DomainErrors'

const NOW = new Date('2026-01-01T10:00:00.000Z')
const creds = { email: 'user@festival.fr', password: 'Secret123!' }

describe('LoginUser', () => {
  it('émet un access token et un refresh token stocké haché', async () => {
    const deps = makeAuthDeps(NOW)
    const user = await deps.registerUser.execute(creds)

    const result = await deps.loginUser.execute(creds)

    expect(typeof result.accessToken).toBe('string')
    expect(result.refreshToken.length).toBeGreaterThan(0)
    expect(JSON.parse(result.accessToken).sub).toBe(user.id)

    const stored = await deps.refreshTokenRepo.findByHash(deps.refreshTokens.hash(result.refreshToken))
    expect(stored).not.toBeNull()
    expect(stored?.isActive(NOW)).toBe(true)
  })

  it('refuse un mauvais mot de passe', async () => {
    const deps = makeAuthDeps(NOW)
    await deps.registerUser.execute(creds)

    await expect(
      deps.loginUser.execute({ email: creds.email, password: 'Wrong123!' }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError)
  })

  it('refuse un email inconnu', async () => {
    const deps = makeAuthDeps(NOW)

    await expect(
      deps.loginUser.execute({ email: 'unknown@festival.fr', password: 'Secret123!' }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError)
  })
})
