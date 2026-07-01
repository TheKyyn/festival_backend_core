export interface EnvConfig {
  port: number
  jwtAccessSecret: string
  accessTokenTtl: string
  refreshTokenTtlMs: number
  bcryptRounds: number
}

const DURATION_UNIT_MS: Record<string, number> = {
  s: 1000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
}

/** Convertit une durée type "7d", "15m", "30s" en millisecondes. */
function parseDurationMs(input: string): number {
  const match = /^(\d+)([smhd])$/.exec(input.trim())
  const value = match ? Number(match[1]) : Number.NaN
  const unit = match ? match[2] : undefined
  const unitMs = unit ? DURATION_UNIT_MS[unit] : undefined
  if (Number.isNaN(value) || unitMs === undefined) {
    throw new Error(`Durée invalide: ${input}`)
  }
  return value * unitMs
}

const DEFAULT_ACCESS_SECRET = 'dev-access-secret-change-me'

/** Résout le secret JWT ; interdit la valeur par défaut en production. */
function resolveJwtSecret(): string {
  const secret = process.env.JWT_ACCESS_SECRET
  const isProduction = process.env.NODE_ENV === 'production'
  if (isProduction && (!secret || secret === DEFAULT_ACCESS_SECRET)) {
    throw new Error(
      'JWT_ACCESS_SECRET doit être défini et différent de la valeur par défaut en production.',
    )
  }
  return secret ?? DEFAULT_ACCESS_SECRET
}

/** Charge la configuration depuis les variables d'environnement (avec valeurs par défaut de dev). */
export function loadEnv(): EnvConfig {
  return {
    port: Number(process.env.PORT ?? 3000),
    jwtAccessSecret: resolveJwtSecret(),
    accessTokenTtl: process.env.JWT_ACCESS_TTL ?? '15m',
    refreshTokenTtlMs: parseDurationMs(process.env.JWT_REFRESH_TTL ?? '7d'),
    bcryptRounds: Number(process.env.BCRYPT_ROUNDS ?? 10),
  }
}
