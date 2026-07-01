import type { RefreshToken } from '../entities/RefreshToken'

/**
 * Port de persistance des refresh tokens.
 * La recherche se fait par hash (le token en clair n'est jamais stocké).
 */
export interface RefreshTokenRepository {
  findByHash(tokenHash: string): Promise<RefreshToken | null>
  save(token: RefreshToken): Promise<void>
}
