import { describe, expect, it } from 'vitest'
import { Prisma, type PrismaClient } from '@prisma/client'

import { PrismaUserRepository } from '../../../src/infrastructure/persistence/prisma/repositories/PrismaUserRepository'
import { EmailAlreadyInUseError } from '../../../src/domain/errors/DomainErrors'
import { User } from '../../../src/domain/entities/User'
import { Email } from '../../../src/domain/value-objects/Email'
import { Role } from '../../../src/domain/value-objects/Role'

function makeUser(): User {
  return new User({
    id: 'user-1',
    email: Email.create('dup@festival.fr'),
    passwordHash: 'hashed',
    role: Role.VISITOR,
    createdAt: new Date('2026-01-01T10:00:00.000Z'),
  })
}

describe('PrismaUserRepository.save', () => {
  it('traduit une violation d unicité P2002 en EmailAlreadyInUseError', async () => {
    const client = {
      user: {
        upsert: async () => {
          throw new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
            code: 'P2002',
            clientVersion: '6.0.0',
          })
        },
      },
    } as unknown as PrismaClient

    const repository = new PrismaUserRepository(client)

    await expect(repository.save(makeUser())).rejects.toBeInstanceOf(EmailAlreadyInUseError)
  })
})
