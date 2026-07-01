/**
 * Port : génération d'identifiants.
 * Le domaine ne doit pas connaître `uuid` : l'implémentation vit en infrastructure,
 * un générateur séquentiel prévisible est utilisé en test.
 */
export interface IdGenerator {
  next(): string
}
