/**
 * Port : génération et hachage des refresh tokens.
 * - generate() produit un token aléatoire à forte entropie (valeur en clair).
 * - hash() produit un hash déterministe pour le stockage et la recherche.
 * Implémentation via le module crypto de Node en infrastructure.
 */
export interface RefreshTokenService {
  generate(): string
  hash(rawToken: string): string
}
