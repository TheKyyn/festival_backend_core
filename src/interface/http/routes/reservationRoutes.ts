import { Router } from 'express'

import { asyncHandler } from '../asyncHandler'
import { authenticate } from '../middlewares/authenticate'
import { authorize } from '../middlewares/authorize'
import { toReservationView } from '../presenters/reservationView'
import type { AppDependencies } from '../AppDependencies'

export function reservationRoutes(deps: AppDependencies): Router {
  const router = Router()

  // Toutes les routes de réservation nécessitent une authentification.
  router.use(authenticate(deps.tokenService))

  router.post(
    '/',
    asyncHandler(async (req, res) => {
      const { slotId } = req.body ?? {}
      if (typeof slotId !== 'string') {
        res.status(400).json({ error: 'INVALID_INPUT', message: 'slotId est requis.' })
        return
      }
      const reservation = await deps.createReservation.execute({
        userId: req.user!.id,
        userRole: req.user!.role,
        slotId,
      })
      res.status(201).json(toReservationView(reservation))
    }),
  )

  router.get(
    '/me',
    asyncHandler(async (req, res) => {
      const reservations = await deps.listMyReservations.execute({ userId: req.user!.id })
      res.status(200).json(reservations.map(toReservationView))
    }),
  )

  router.delete(
    '/:id',
    asyncHandler(async (req, res) => {
      const reservation = await deps.cancelReservation.execute({
        reservationId: req.params.id ?? '',
        actingUserId: req.user!.id,
        actingUserRole: req.user!.role,
      })
      res.status(200).json(toReservationView(reservation))
    }),
  )

  router.post(
    '/:id/validate',
    authorize('VALIDATE_RESERVATION'),
    asyncHandler(async (req, res) => {
      const reservation = await deps.validateReservation.execute({
        reservationId: req.params.id ?? '',
        actingUserRole: req.user!.role,
      })
      res.status(200).json(toReservationView(reservation))
    }),
  )

  return router
}
