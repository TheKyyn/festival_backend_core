/**
 * Value Object : email valide et normalisé (trim + minuscules).
 * Garantit l'invariant "un Email est toujours valide" dès sa construction.
 * Domaine pur.
 */
export class Email {
  private static readonly PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  private constructor(public readonly value: string) {}

  static create(raw: string): Email {
    const normalized = raw.trim().toLowerCase()
    if (!Email.PATTERN.test(normalized)) {
      throw new Error(`Email invalide: ${raw}`)
    }
    return new Email(normalized)
  }

  equals(other: Email): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value
  }
}
