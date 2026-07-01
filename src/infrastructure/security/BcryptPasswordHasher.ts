import bcrypt from 'bcryptjs'

import type { PasswordHasher } from '../../application/ports/PasswordHasher'

/**
 * Adapter du port PasswordHasher basé sur l'algorithme bcrypt (via bcryptjs,
 * implémentation pure JS retenue pour éviter toute compilation native à l'install).
 */
export class BcryptPasswordHasher implements PasswordHasher {
  constructor(private readonly rounds = 10) {}

  hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.rounds)
  }

  compare(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash)
  }
}
