import { Router } from 'express'

import { asyncHandler } from '../asyncHandler'
import { authenticate } from '../middlewares/authenticate'
import { authorize } from '../middlewares/authorize'
import { Role } from '../../../domain/value-objects/Role'
import { toEventView } from '../presenters/eventView'
import { toSlotView } from '../presenters/slotView'
import type { AppDependencies } from '../AppDependencies'

function parseDate(value: unknown): Date | null {
  if (typeof value !== 'string') return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function eventRoutes(deps: AppDependencies): Router {
  const router = Router()

  // Public : liste des événements.
  router.get(
    '/',
    asyncHandler(async (_req, res) => {
      const events = await deps.listEvents.execute()
      res.status(200).json(events.map(toEventView))
    }),
  )

  // ORGANIZER ou ADMIN : création d'un événement.
  router.post(
    '/',
    authenticate(deps.tokenService),
    authorize('CREATE_EVENT'),
    asyncHandler(async (req, res) => {
      const { title, description, venueId, startDate, endDate } = req.body ?? {}
      const start = parseDate(startDate)
      const end = parseDate(endDate)
      if (
        typeof title !== 'string' ||
        typeof description !== 'string' ||
        typeof venueId !== 'string' ||
        !start ||
        !end
      ) {
        res.status(400).json({
          error: 'INVALID_INPUT',
          message: 'title, description, venueId, startDate et endDate sont requis.',
        })
        return
      }
      const event = await deps.createEvent.execute({
        title,
        description,
        venueId,
        organizerId: req.user!.id,
        startDate: start,
        endDate: end,
      })
      res.status(201).json(toEventView(event))
    }),
  )

  // Public : créneaux d'un événement.
  router.get(
    '/:id/slots',
    asyncHandler(async (req, res) => {
      const slots = await deps.getEventSlots.execute({ eventId: req.params.id ?? '' })
      res.status(200).json(slots.map(toSlotView))
    }),
  )

  // ORGANIZER propriétaire ou ADMIN : ajout d'un créneau (ownership vérifié dans le use case).
  router.post(
    '/:id/slots',
    authenticate(deps.tokenService),
    authorize('CREATE_EVENT'),
    asyncHandler(async (req, res) => {
      const { startTime, endTime, capacity, allowedRoles } = req.body ?? {}
      const start = parseDate(startTime)
      const end = parseDate(endTime)
      if (!start || !end || typeof capacity !== 'number') {
        res.status(400).json({
          error: 'INVALID_INPUT',
          message: 'startTime, endTime (dates) et capacity (nombre) sont requis.',
        })
        return
      }

      let roles: Role[] | undefined
      if (allowedRoles !== undefined) {
        if (!Array.isArray(allowedRoles) || !allowedRoles.every((role) => typeof role === 'string')) {
          res.status(400).json({ error: 'INVALID_INPUT', message: 'allowedRoles doit être un tableau de chaînes.' })
          return
        }
        try {
          roles = allowedRoles.map((role) => Role.fromString(role))
        } catch {
          res.status(400).json({ error: 'INVALID_INPUT', message: 'allowedRoles contient un rôle invalide.' })
          return
        }
      }

      const slot = await deps.createSlot.execute({
        eventId: req.params.id ?? '',
        actingUserId: req.user!.id,
        actingUserRole: req.user!.role,
        startTime: start,
        endTime: end,
        capacity,
        allowedRoles: roles,
      })
      res.status(201).json(toSlotView(slot))
    }),
  )

  return router
}
