import type { NextFunction, Request, RequestHandler, Response } from 'express'

/**
 * Enveloppe un handler asynchrone pour transmettre toute erreur rejetée au
 * middleware d'erreurs (Express 4 ne capture pas les rejets de promesses).
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next)
  }
}
