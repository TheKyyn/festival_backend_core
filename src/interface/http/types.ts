import type { Role } from '../../domain/value-objects/Role'

/** Utilisateur authentifié attaché à la requête par le middleware authenticate. */
export interface AuthenticatedUser {
  id: string
  role: Role
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser
    }
  }
}
