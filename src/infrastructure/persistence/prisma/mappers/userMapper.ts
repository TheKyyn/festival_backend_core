import type { User as PrismaUser } from '@prisma/client'

import { User } from '../../../../domain/entities/User'
import { Email } from '../../../../domain/value-objects/Email'
import { Role } from '../../../../domain/value-objects/Role'

/** Modèle de persistance -> entité domaine. */
export function toDomainUser(row: PrismaUser): User {
  return new User({
    id: row.id,
    email: Email.create(row.email),
    passwordHash: row.passwordHash,
    role: Role.fromString(row.role),
    firstName: row.firstName ?? undefined,
    lastName: row.lastName ?? undefined,
    createdAt: row.createdAt,
  })
}

/** Entité domaine -> données de persistance. */
export function toPersistenceUser(user: User): PrismaUser {
  return {
    id: user.id,
    email: user.email.value,
    passwordHash: user.passwordHash,
    role: user.role.name,
    firstName: user.firstName ?? null,
    lastName: user.lastName ?? null,
    createdAt: user.createdAt,
  }
}
