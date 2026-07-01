import { UserNotFoundError } from '../../../domain/errors/DomainErrors'
import type { User } from '../../../domain/entities/User'
import type { UserRepository } from '../../../domain/repositories/UserRepository'

export interface GetProfileCommand {
  userId: string
}

export interface GetProfileDeps {
  users: UserRepository
}

/** Récupère le profil de l'utilisateur authentifié. */
export class GetProfile {
  constructor(private readonly deps: GetProfileDeps) {}

  async execute(command: GetProfileCommand): Promise<User> {
    const user = await this.deps.users.findById(command.userId)
    if (!user) {
      throw new UserNotFoundError()
    }
    return user
  }
}
