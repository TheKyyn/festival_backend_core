import { Router } from 'express'

import { authenticate } from '../middlewares/authenticate'
import { authorize } from '../middlewares/authorize'
import type { AppDependencies } from '../AppDependencies'

/**
 * Route de démonstration protégée par rôle : réservée à l'action MANAGE_USERS
 * (donc au rôle ADMIN). Sert à illustrer et tester la chaîne authenticate + authorize.
 */
export function adminRoutes(deps: AppDependencies): Router {
  const router = Router()

  router.get(
    '/ping',
    authenticate(deps.tokenService),
    authorize('MANAGE_USERS'),
    (req, res) => {
      res.status(200).json({ status: 'ok', role: req.user!.role.name })
    },
  )

  return router
}
