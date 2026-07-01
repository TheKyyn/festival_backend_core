/** Paramètres d'authentification injectés depuis la configuration (env). */
export interface AuthConfig {
  /** Durée de vie de l'access token, au format accepté par le TokenService (ex: "15m"). */
  accessTokenTtl: string
  /** Durée de vie du refresh token, en millisecondes. */
  refreshTokenTtlMs: number
}
