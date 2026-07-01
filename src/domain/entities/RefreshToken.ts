export interface RefreshTokenProps {
  id: string
  userId: string
  /** Hash du token (jamais la valeur en clair). */
  tokenHash: string
  expiresAt: Date
  createdAt: Date
  revokedAt?: Date | null
}

/**
 * Entité RefreshToken. Ne contient que le HASH du token, jamais sa valeur en clair.
 * Immuable : la révocation renvoie une nouvelle instance.
 */
export class RefreshToken {
  readonly id: string
  readonly userId: string
  readonly tokenHash: string
  readonly expiresAt: Date
  readonly createdAt: Date
  readonly revokedAt: Date | null

  constructor(props: RefreshTokenProps) {
    this.id = props.id
    this.userId = props.userId
    this.tokenHash = props.tokenHash
    this.expiresAt = props.expiresAt
    this.createdAt = props.createdAt
    this.revokedAt = props.revokedAt ?? null
  }

  static create(params: {
    id: string
    userId: string
    tokenHash: string
    expiresAt: Date
    now: Date
  }): RefreshToken {
    return new RefreshToken({
      id: params.id,
      userId: params.userId,
      tokenHash: params.tokenHash,
      expiresAt: params.expiresAt,
      createdAt: params.now,
      revokedAt: null,
    })
  }

  /** Actif = non révoqué et non expiré. */
  isActive(now: Date): boolean {
    return this.revokedAt === null && this.expiresAt.getTime() > now.getTime()
  }

  /** Renvoie une copie révoquée (rotation ou déconnexion). */
  revoke(now: Date): RefreshToken {
    return new RefreshToken({
      id: this.id,
      userId: this.userId,
      tokenHash: this.tokenHash,
      expiresAt: this.expiresAt,
      createdAt: this.createdAt,
      revokedAt: this.revokedAt ?? now,
    })
  }
}
