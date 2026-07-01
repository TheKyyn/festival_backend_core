import type { RequestHandler } from 'express'

import { Role } from '../../../domain/value-objects/Role'
import type { TokenService } from '../../../application/ports/TokenService'

const BEARER_PREFIX = 'Bearer '

/**
 * Vérifie le JWT d'accès (header Authorization: Bearer ...) et attache
 * l'utilisateur (id + rôle) à la requête. Répond 401 si absent ou invalide.
 */
export function authenticate(tokens: TokenService): RequestHandler {
  return (req, res, next) => {
    const header = req.headers.authorization
    if (!header || !header.startsWith(BEARER_PREFIX)) {
      res.status(401).json({ error: 'UNAUTHENTICATED', message: 'Token manquant.' })
      return
    }

    const token = header.slice(BEARER_PREFIX.length)
    try {
      const payload = tokens.verify(token)
      req.user = { id: payload.sub, role: Role.fromString(payload.role) }
      next()
    } catch {
      res.status(401).json({ error: 'UNAUTHENTICATED', message: 'Token invalide.' })
    }
  }
}
