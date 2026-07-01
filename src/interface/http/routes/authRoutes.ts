import { Router } from 'express'

import { asyncHandler } from '../asyncHandler'
import { authenticate } from '../middlewares/authenticate'
import { toPublicUser } from '../presenters/userView'
import type { AppDependencies } from '../AppDependencies'

export function authRoutes(deps: AppDependencies): Router {
  const router = Router()

  router.post(
    '/register',
    asyncHandler(async (req, res) => {
      const { email, password, firstName, lastName } = req.body ?? {}
      if (typeof email !== 'string' || typeof password !== 'string') {
        res.status(400).json({ error: 'INVALID_INPUT', message: 'email et password sont requis.' })
        return
      }
      if (
        (firstName !== undefined && typeof firstName !== 'string') ||
        (lastName !== undefined && typeof lastName !== 'string')
      ) {
        res
          .status(400)
          .json({ error: 'INVALID_INPUT', message: 'firstName et lastName doivent être des chaînes.' })
        return
      }
      const user = await deps.registerUser.execute({ email, password, firstName, lastName })
      res.status(201).json(toPublicUser(user))
    }),
  )

  router.post(
    '/login',
    asyncHandler(async (req, res) => {
      const { email, password } = req.body ?? {}
      if (typeof email !== 'string' || typeof password !== 'string') {
        res.status(400).json({ error: 'INVALID_INPUT', message: 'email et password sont requis.' })
        return
      }
      const result = await deps.loginUser.execute({ email, password })
      res.status(200).json({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: toPublicUser(result.user),
      })
    }),
  )

  router.post(
    '/refresh',
    asyncHandler(async (req, res) => {
      const { refreshToken } = req.body ?? {}
      if (typeof refreshToken !== 'string') {
        res.status(400).json({ error: 'INVALID_INPUT', message: 'refreshToken est requis.' })
        return
      }
      const result = await deps.refreshTokens.execute({ refreshToken })
      res.status(200).json({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: toPublicUser(result.user),
      })
    }),
  )

  router.post(
    '/logout',
    asyncHandler(async (req, res) => {
      const { refreshToken } = req.body ?? {}
      if (typeof refreshToken !== 'string') {
        res.status(400).json({ error: 'INVALID_INPUT', message: 'refreshToken est requis.' })
        return
      }
      await deps.logoutUser.execute({ refreshToken })
      res.status(204).send()
    }),
  )

  router.get(
    '/me',
    authenticate(deps.tokenService),
    asyncHandler(async (req, res) => {
      const user = await deps.getProfile.execute({ userId: req.user!.id })
      res.status(200).json(toPublicUser(user))
    }),
  )

  return router
}
