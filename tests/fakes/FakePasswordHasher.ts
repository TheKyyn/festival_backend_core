import type { PasswordHasher } from '../../src/application/ports/PasswordHasher'

/**
 * Hasher factice et déterministe pour les tests unitaires (pas de bcrypt réel,
 * donc rapide). Le "hash" est simplement préfixé.
 */
export class FakePasswordHasher implements PasswordHasher {
  private static readonly PREFIX = 'hashed:'

  async hash(plain: string): Promise<string> {
    return `${FakePasswordHasher.PREFIX}${plain}`
  }

  async compare(plain: string, hash: string): Promise<boolean> {
    return hash === `${FakePasswordHasher.PREFIX}${plain}`
  }
}
