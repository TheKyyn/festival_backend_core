import { Router } from 'express'

import { asyncHandler } from '../asyncHandler'
import { authenticate } from '../middlewares/authenticate'
import { authorize } from '../middlewares/authorize'
import { toVenueView } from '../presenters/venueView'
import type { AppDependencies } from '../AppDependencies'

export function venueRoutes(deps: AppDependencies): Router {
  const router = Router()

  router.post(
    '/',
    authenticate(deps.tokenService),
    authorize('CREATE_EVENT'),
    asyncHandler(async (req, res) => {
      const { name, address, capacity } = req.body ?? {}
      if (typeof name !== 'string' || typeof address !== 'string' || typeof capacity !== 'number') {
        res
          .status(400)
          .json({ error: 'INVALID_INPUT', message: 'name, address (chaînes) et capacity (nombre) sont requis.' })
        return
      }
      const venue = await deps.createVenue.execute({ name, address, capacity })
      res.status(201).json(toVenueView(venue))
    }),
  )

  return router
}
