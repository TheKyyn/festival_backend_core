import express, { type Express } from 'express'

import { authRoutes } from './routes/authRoutes'
import { adminRoutes } from './routes/adminRoutes'
import { reservationRoutes } from './routes/reservationRoutes'
import { errorHandler } from './errorHandler'
import type { AppDependencies } from './AppDependencies'
import './types'

/**
 * Assemble l'application Express : endpoint de santé, routes d'authentification,
 * route d'administration protégée par rôle, puis gestionnaire d'erreurs global.
 */
export function createApp(deps: AppDependencies): Express {
  const app = express()
  app.use(express.json())

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' })
  })

  app.use('/api/auth', authRoutes(deps))
  app.use('/api/admin', adminRoutes(deps))
  app.use('/api/reservations', reservationRoutes(deps))

  app.use(errorHandler)

  return app
}
