import { Prisma, type PrismaClient } from '@prisma/client'

import { EmailAlreadyInUseError } from '../../../../domain/errors/DomainErrors'
import type { User } from '../../../../domain/entities/User'
import type { UserRepository } from '../../../../domain/repositories/UserRepository'
import { toDomainUser, toPersistenceUser } from '../mappers/userMapper'

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly client: PrismaClient) {}

  async findById(id: string): Promise<User | null> {
    const row = await this.client.user.findUnique({ where: { id } })
    return row ? toDomainUser(row) : null
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.client.user.findUnique({ where: { email: email.trim().toLowerCase() } })
    return row ? toDomainUser(row) : null
  }

  async save(user: User): Promise<void> {
    const data = toPersistenceUser(user)
    try {
      await this.client.user.upsert({ where: { id: user.id }, create: data, update: data })
    } catch (error) {
      // Contrainte d'unicité sur User.email : traduit la violation base en erreur métier.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new EmailAlreadyInUseError()
      }
      throw error
    }
  }
}
