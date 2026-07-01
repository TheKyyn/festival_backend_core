import type { User } from '../entities/User'

/**
 * Port de persistance des utilisateurs.
 * Le domaine DÉFINIT le contrat ; l'infrastructure (Prisma) et les tests
 * (in-memory) FOURNISSENT les implémentations. C'est l'inversion de dépendance.
 */
export interface UserRepository {
  findById(id: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  save(user: User): Promise<void>
}
