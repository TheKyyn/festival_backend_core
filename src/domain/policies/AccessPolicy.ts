import type { Role, RoleName } from '../value-objects/Role'

/** Actions sensibles de la plateforme soumises à autorisation. */
export type Action = 'RESERVE' | 'VALIDATE_RESERVATION' | 'CREATE_EVENT' | 'MANAGE_USERS'

/**
 * Politique d'autorisation EXPLICITE par action.
 * Chaque action liste précisément les rôles qui la possèdent. Aucune règle
 * de hiérarchie : ajouter/retirer un droit se fait ici, sans effet de bord.
 * Cette même table servira de source unique au middleware `authorize` (HTTP).
 */
const ALLOWED_ROLES: Record<Action, ReadonlyArray<RoleName>> = {
  RESERVE: ['VISITOR', 'STAFF', 'ORGANIZER', 'ADMIN'],
  VALIDATE_RESERVATION: ['STAFF', 'ORGANIZER', 'ADMIN'],
  CREATE_EVENT: ['ORGANIZER', 'ADMIN'],
  MANAGE_USERS: ['ADMIN'],
}

/** Vrai si le rôle est explicitement autorisé à effectuer l'action. */
export function can(role: Role, action: Action): boolean {
  return ALLOWED_ROLES[action].includes(role.name)
}
