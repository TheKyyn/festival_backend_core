import type { RefreshToken } from '../entities/RefreshToken'

/**
 * Port de persistance des refresh tokens.
 * La recherche se fait par hash (le token en clair n'est jamais stocké).
 */
export interface RefreshTokenRepository {
  findByHash(tokenHash: string): Promise<RefreshToken | null>
  save(token: RefreshToken): Promise<void>

  /**
   * Consomme atomiquement un refresh token : le révoque UNIQUEMENT s'il est
   * encore actif (non révoqué et non expiré) à l'instant `now`, et renvoie le
   * token consommé. Renvoie null si aucun token actif ne correspond (déjà
   * consommé, expiré ou introuvable). Cette opération doit être atomique côté
   * base pour empêcher le rejeu concurrent d'un même token.
   */
  consume(tokenHash: string, now: Date): Promise<RefreshToken | null>
}
