import { PrismaClient } from '@prisma/client'

/** Fabrique un client Prisma. La connexion n'est établie qu'à la première requête. */
export function createPrismaClient(): PrismaClient {
  return new PrismaClient()
}
