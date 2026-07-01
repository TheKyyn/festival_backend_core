export interface TokenPayload {
  /** Identifiant de l'utilisateur (subject). */
  sub: string
  role: string
}

/**
 * Port : émission et vérification de tokens.
 * Implémentation JWT en infrastructure (étape Authentification avancée).
 */
export interface TokenService {
  sign(payload: TokenPayload, ttl: string): string
  verify(token: string): TokenPayload
}
