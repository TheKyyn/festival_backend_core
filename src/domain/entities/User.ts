import type { Email } from '../value-objects/Email'
import type { Role } from '../value-objects/Role'

export interface UserProps {
  id: string
  email: Email
  passwordHash: string
  role: Role
  firstName?: string
  lastName?: string
  createdAt: Date
}

/**
 * Entité User. Objet métier pur : elle ne connaît ni Prisma, ni la manière
 * dont elle est stockée. Le hash du mot de passe est calculé en amont par un
 * PasswordHasher (couche infrastructure) — le domaine ne fait jamais de hachage.
 */
export class User {
  readonly id: string
  readonly email: Email
  readonly passwordHash: string
  readonly role: Role
  readonly firstName?: string
  readonly lastName?: string
  readonly createdAt: Date

  constructor(props: UserProps) {
    this.id = props.id
    this.email = props.email
    this.passwordHash = props.passwordHash
    this.role = props.role
    this.firstName = props.firstName
    this.lastName = props.lastName
    this.createdAt = props.createdAt
  }
}
