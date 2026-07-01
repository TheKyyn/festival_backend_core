import { describe, expect, it } from 'vitest'

import { toDomainUser, toPersistenceUser } from '../../../src/infrastructure/persistence/prisma/mappers/userMapper'
import { Role } from '../../../src/domain/value-objects/Role'

const row = {
  id: 'user-1',
  email: 'visiteur@festival.fr',
  passwordHash: 'hashed-value',
  role: 'VISITOR',
  firstName: null,
  lastName: null,
  createdAt: new Date('2026-01-01T10:00:00.000Z'),
}

describe('userMapper', () => {
  it('convertit un modèle Prisma en entité domaine', () => {
    const user = toDomainUser(row)

    expect(user.id).toBe('user-1')
    expect(user.email.value).toBe('visiteur@festival.fr')
    expect(user.role.equals(Role.VISITOR)).toBe(true)
    expect(user.firstName).toBeUndefined()
    expect(user.createdAt.toISOString()).toBe('2026-01-01T10:00:00.000Z')
  })

  it('reconvertit une entité domaine en modèle de persistance (aller-retour)', () => {
    const user = toDomainUser(row)

    expect(toPersistenceUser(user)).toEqual(row)
  })
})
