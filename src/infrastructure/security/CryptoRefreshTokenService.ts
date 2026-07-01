import { createHash, randomBytes } from 'node:crypto'

import type { RefreshTokenService } from '../../application/ports/RefreshTokenService'

/**
 * Adapter du port RefreshTokenService basé sur le module crypto de Node.
 * - generate() : 32 octets aléatoires en hexadécimal (256 bits d'entropie).
 * - hash() : SHA-256 déterministe, adapté au stockage et à la recherche par hash
 *   (le token étant aléatoire, un hash rapide suffit ; bcrypt est réservé aux
 *   mots de passe à faible entropie).
 */
export class CryptoRefreshTokenService implements RefreshTokenService {
  generate(): string {
    return randomBytes(32).toString('hex')
  }

  hash(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex')
  }
}
