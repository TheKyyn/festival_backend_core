import type { ErrorRequestHandler } from 'express'

import { DomainError } from '../../domain/errors/DomainErrors'

/** Traduit chaque code d'erreur métier en statut HTTP. Source unique de vérité. */
const STATUS_BY_CODE: Record<string, number> = {
  // Réservation
  SLOT_NOT_FOUND: 404,
  SLOT_IN_PAST: 409,
  ACCESS_NOT_ALLOWED: 403,
  DUPLICATE_RESERVATION: 409,
  SLOT_FULL: 409,
  RESERVATION_QUOTA_EXCEEDED: 409,
  SCHEDULE_CONFLICT: 409,
  RESERVATION_NOT_FOUND: 404,
  INVALID_RESERVATION_STATE: 409,
  // Authentification
  WEAK_PASSWORD: 400,
  EMAIL_ALREADY_IN_USE: 409,
  INVALID_CREDENTIALS: 401,
  INVALID_REFRESH_TOKEN: 401,
  USER_NOT_FOUND: 404,
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof DomainError) {
    const status = STATUS_BY_CODE[err.code] ?? 400
    res.status(status).json({ error: err.code, message: err.message })
    return
  }

  // Erreurs de validation d'entrée levées par les value objects (Email invalide...).
  if (err instanceof Error && err.message.startsWith('Email invalide')) {
    res.status(400).json({ error: 'INVALID_INPUT', message: err.message })
    return
  }

  console.error(err)
  res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Erreur interne.' })
}
