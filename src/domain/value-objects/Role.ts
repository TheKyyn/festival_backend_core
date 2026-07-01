export type RoleName = 'VISITOR' | 'STAFF' | 'ORGANIZER' | 'ADMIN'

/**
 * Value Object : rôle d'un utilisateur.
 * Le rôle ne porte AUCUNE hiérarchie implicite : les droits sont décidés
 * explicitement par action dans AccessPolicy. Un rôle n'hérite donc jamais
 * d'un droit qui ne lui a pas été attribué.
 */
export class Role {
  static readonly VISITOR = new Role('VISITOR')
  static readonly STAFF = new Role('STAFF')
  static readonly ORGANIZER = new Role('ORGANIZER')
  static readonly ADMIN = new Role('ADMIN')

  private constructor(public readonly name: RoleName) {}

  equals(other: Role): boolean {
    return this.name === other.name
  }

  static all(): Role[] {
    return [Role.VISITOR, Role.STAFF, Role.ORGANIZER, Role.ADMIN]
  }

  static fromString(value: string): Role {
    const role = Role.all().find((r) => r.name === value)
    if (!role) {
      throw new Error(`Rôle invalide: ${value}`)
    }
    return role
  }
}
