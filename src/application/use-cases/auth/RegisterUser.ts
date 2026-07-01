import { User } from '../../../domain/entities/User'
import { Email } from '../../../domain/value-objects/Email'
import { Role } from '../../../domain/value-objects/Role'
import { EmailAlreadyInUseError, WeakPasswordError } from '../../../domain/errors/DomainErrors'
import type { UserRepository } from '../../../domain/repositories/UserRepository'
import type { PasswordHasher } from '../../ports/PasswordHasher'
import type { IdGenerator } from '../../ports/IdGenerator'
import type { Clock } from '../../ports/Clock'

const MIN_PASSWORD_LENGTH = 8

export interface RegisterUserCommand {
  email: string
  password: string
  firstName?: string
  lastName?: string
}

export interface RegisterUserDeps {
  users: UserRepository
  hasher: PasswordHasher
  ids: IdGenerator
  clock: Clock
}

/**
 * Inscription : valide la longueur du mot de passe et l'unicité de l'email,
 * hache le mot de passe, crée un utilisateur avec le rôle VISITOR par défaut.
 */
export class RegisterUser {
  constructor(private readonly deps: RegisterUserDeps) {}

  async execute(command: RegisterUserCommand): Promise<User> {
    const { users, hasher, ids, clock } = this.deps

    if (!command.password || command.password.length < MIN_PASSWORD_LENGTH) {
      throw new WeakPasswordError(MIN_PASSWORD_LENGTH)
    }

    const email = Email.create(command.email)

    const existing = await users.findByEmail(email.value)
    if (existing) {
      throw new EmailAlreadyInUseError()
    }

    const passwordHash = await hasher.hash(command.password)

    const user = new User({
      id: ids.next(),
      email,
      passwordHash,
      role: Role.VISITOR,
      firstName: command.firstName,
      lastName: command.lastName,
      createdAt: clock.now(),
    })
    await users.save(user)
    return user
  }
}
