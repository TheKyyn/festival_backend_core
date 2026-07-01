import type { User } from '../../../domain/entities/User'
import type { UserRepository } from '../../../domain/repositories/UserRepository'

/**
 * Adapter de persistance en mémoire du UserRepository.
 * Utilisé pour le développement sans base et par les tests.
 */
export class InMemoryUserRepository implements UserRepository {
  private readonly users = new Map<string, User>()

  constructor(initial: User[] = []) {
    for (const user of initial) this.users.set(user.id, user)
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null
  }

  async findByEmail(email: string): Promise<User | null> {
    const normalized = email.trim().toLowerCase()
    return [...this.users.values()].find((user) => user.email.value === normalized) ?? null
  }

  async save(user: User): Promise<void> {
    this.users.set(user.id, user)
  }
}
