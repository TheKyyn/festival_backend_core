import type { RequestHandler } from 'express'

import { can, type Action } from '../../../domain/policies/AccessPolicy'

/**
 * Autorise l'action uniquement si le rôle de l'utilisateur y a droit
 * (selon AccessPolicy). Répond 401 si non authentifié, 403 si droits insuffisants.
 * À utiliser après le middleware authenticate.
 */
export function authorize(action: Action): RequestHandler {
  return (req, res, next) => {
    const user = req.user
    if (!user) {
      res.status(401).json({ error: 'UNAUTHENTICATED', message: 'Authentification requise.' })
      return
    }
    if (!can(user.role, action)) {
      res.status(403).json({ error: 'FORBIDDEN', message: 'Droits insuffisants.' })
      return
    }
    next()
  }
}
