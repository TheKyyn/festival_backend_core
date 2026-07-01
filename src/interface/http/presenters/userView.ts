import type { User } from '../../../domain/entities/User'

export interface PublicUser {
  id: string
  email: string
  role: string
  firstName?: string
  lastName?: string
  createdAt: string
}

/** Projection publique d'un utilisateur : n'expose jamais le hash du mot de passe. */
export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email.value,
    role: user.role.name,
    firstName: user.firstName,
    lastName: user.lastName,
    createdAt: user.createdAt.toISOString(),
  }
}
