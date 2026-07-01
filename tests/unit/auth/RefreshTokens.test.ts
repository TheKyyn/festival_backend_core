import { describe, expect, it } from 'vitest'

import { makeAuthDeps } from '../../support/authDeps'
import { RefreshToken } from '../../../src/domain/entities/RefreshToken'
import { InvalidRefreshTokenError } from '../../../src/domain/errors/DomainErrors'

const NOW = new Date('2026-01-01T10:00:00.000Z')
const creds = { email: 'user@festival.fr', password: 'Secret123!' }

describe('RefreshTokens (rotation)', () => {
  it('émet un nouveau couple et invalide l ancien refresh token', async () => {
    const deps = makeAuthDeps(NOW)
    await deps.registerUser.execute(creds)
    const login = await deps.loginUser.execute(creds)

    const rotated = await deps.refreshUseCase.execute({ refreshToken: login.refreshToken })
    expect(rotated.refreshToken).not.toBe(login.refreshToken)

    // L'ancien token ne doit plus fonctionner (rotation).
    await expect(
      deps.refreshUseCase.execute({ refreshToken: login.refreshToken }),
    ).rejects.toBeInstanceOf(InvalidRefreshTokenError)
  })

  it('refuse un refresh token inconnu', async () => {
    const deps = makeAuthDeps(NOW)

    await expect(
      deps.refreshUseCase.execute({ refreshToken: 'inconnu' }),
    ).rejects.toBeInstanceOf(InvalidRefreshTokenError)
  })

  it('refuse un refresh token expiré', async () => {
    const deps = makeAuthDeps(NOW)
    const raw = 'raw-refresh-token'
    await deps.refreshTokenRepo.save(
      RefreshToken.create({
        id: 'rt-1',
        userId: 'user-1',
        tokenHash: deps.refreshTokens.hash(raw),
        expiresAt: new Date('2025-12-01T00:00:00.000Z'),
        now: new Date('2025-11-01T00:00:00.000Z'),
      }),
    )

    await expect(
      deps.refreshUseCase.execute({ refreshToken: raw }),
    ).rejects.toBeInstanceOf(InvalidRefreshTokenError)
  })
})
