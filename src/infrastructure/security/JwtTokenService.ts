import jwt from 'jsonwebtoken'

import type { TokenPayload, TokenService } from '../../application/ports/TokenService'

/** Adapter du port TokenService basé sur JWT (jsonwebtoken) pour les access tokens. */
export class JwtTokenService implements TokenService {
  constructor(private readonly secret: string) {}

  sign(payload: TokenPayload, ttl: string): string {
    const options: jwt.SignOptions = {
      expiresIn: ttl as jwt.SignOptions['expiresIn'],
      algorithm: 'HS256',
    }
    return jwt.sign({ sub: payload.sub, role: payload.role }, this.secret, options)
  }

  verify(token: string): TokenPayload {
    // Algorithme figé : empêche l'acceptation d'un token signé autrement (ex: alg=none).
    const decoded = jwt.verify(token, this.secret, { algorithms: ['HS256'] })
    if (
      typeof decoded === 'string' ||
      typeof decoded.sub !== 'string' ||
      typeof decoded.role !== 'string'
    ) {
      throw new Error('Token invalide')
    }
    return { sub: decoded.sub, role: decoded.role }
  }
}
