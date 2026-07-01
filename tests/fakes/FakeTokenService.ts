import type { TokenPayload, TokenService } from '../../src/application/ports/TokenService'

/**
 * TokenService factice et déterministe pour les tests unitaires.
 * Le "token" encode simplement le payload en JSON ; verify le relit.
 */
export class FakeTokenService implements TokenService {
  sign(payload: TokenPayload, _ttl: string): string {
    return JSON.stringify(payload)
  }

  verify(token: string): TokenPayload {
    const parsed = JSON.parse(token) as TokenPayload
    if (typeof parsed.sub !== 'string' || typeof parsed.role !== 'string') {
      throw new Error('Token invalide')
    }
    return parsed
  }
}
