import type { PrismaClient } from '@prisma/client'

import { assembleContainer, type Container } from './container'
import { loadEnv, type EnvConfig } from '../infrastructure/config/env'
import { PrismaUserRepository } from '../infrastructure/persistence/prisma/repositories/PrismaUserRepository'
import { PrismaSlotRepository } from '../infrastructure/persistence/prisma/repositories/PrismaSlotRepository'
import { PrismaReservationRepository } from '../infrastructure/persistence/prisma/repositories/PrismaReservationRepository'
import { PrismaRefreshTokenRepository } from '../infrastructure/persistence/prisma/repositories/PrismaRefreshTokenRepository'
import { PrismaEventRepository } from '../infrastructure/persistence/prisma/repositories/PrismaEventRepository'
import { PrismaVenueRepository } from '../infrastructure/persistence/prisma/repositories/PrismaVenueRepository'

/** Conteneur avec repositories PostgreSQL via Prisma (utilisé par le serveur). */
export function buildPrismaContainer(client: PrismaClient, env: EnvConfig = loadEnv()): Container {
  return assembleContainer(
    {
      users: new PrismaUserRepository(client),
      slots: new PrismaSlotRepository(client),
      reservations: new PrismaReservationRepository(client),
      refreshTokens: new PrismaRefreshTokenRepository(client),
      events: new PrismaEventRepository(client),
      venues: new PrismaVenueRepository(client),
    },
    env,
  )
}
