/**
 * Port : hachage et vérification de mot de passe.
 * Implémentation bcrypt/argon2 en infrastructure (étape Authentification).
 * Le domaine ne manipule jamais de mot de passe en clair au repos.
 */
export interface PasswordHasher {
  hash(plain: string): Promise<string>
  compare(plain: string, hash: string): Promise<boolean>
}
