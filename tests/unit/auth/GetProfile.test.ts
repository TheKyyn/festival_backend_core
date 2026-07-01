import { describe, expect, it } from 'vitest'

import { makeAuthDeps } from '../../support/authDeps'
import { UserNotFoundError } from '../../../src/domain/errors/DomainErrors'

const NOW = new Date('2026-01-01T10:00:00.000Z')

describe('GetProfile', () => {
  it('renvoie le profil d un utilisateur existant', async () => {
    const deps = makeAuthDeps(NOW)
    const user = await deps.registerUser.execute({ email: 'me@festival.fr', password: 'Secret123!' })

    const profile = await deps.getProfile.execute({ userId: user.id })

    expect(profile.id).toBe(user.id)
    expect(profile.email.value).toBe('me@festival.fr')
  })

  it('échoue pour un utilisateur inconnu', async () => {
    const deps = makeAuthDeps(NOW)

    await expect(deps.getProfile.execute({ userId: 'nope' })).rejects.toBeInstanceOf(UserNotFoundError)
  })
})
