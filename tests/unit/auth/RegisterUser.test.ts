import { describe, expect, it } from 'vitest'

import { makeAuthDeps } from '../../support/authDeps'
import { Role } from '../../../src/domain/value-objects/Role'
import { EmailAlreadyInUseError, WeakPasswordError } from '../../../src/domain/errors/DomainErrors'

const NOW = new Date('2026-01-01T10:00:00.000Z')

describe('RegisterUser', () => {
  it('inscrit un utilisateur VISITOR avec un mot de passe haché', async () => {
    const deps = makeAuthDeps(NOW)

    const user = await deps.registerUser.execute({ email: 'Test@Festival.fr', password: 'Secret123!' })

    expect(user.role.equals(Role.VISITOR)).toBe(true)
    expect(user.email.value).toBe('test@festival.fr')
    expect(user.passwordHash).toBe('hashed:Secret123!')
    await expect(deps.users.findByEmail('test@festival.fr')).resolves.not.toBeNull()
  })

  it('refuse un mot de passe trop court', async () => {
    const deps = makeAuthDeps(NOW)

    await expect(
      deps.registerUser.execute({ email: 'a@festival.fr', password: 'court' }),
    ).rejects.toBeInstanceOf(WeakPasswordError)
  })

  it('refuse un email déjà utilisé', async () => {
    const deps = makeAuthDeps(NOW)
    await deps.registerUser.execute({ email: 'dup@festival.fr', password: 'Secret123!' })

    await expect(
      deps.registerUser.execute({ email: 'dup@festival.fr', password: 'Another123!' }),
    ).rejects.toBeInstanceOf(EmailAlreadyInUseError)
  })
})
