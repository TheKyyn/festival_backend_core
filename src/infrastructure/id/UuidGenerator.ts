import { randomUUID } from 'node:crypto'

import type { IdGenerator } from '../../application/ports/IdGenerator'

/** Adapter réel du port IdGenerator : UUID v4 via le module crypto de Node. */
export class UuidGenerator implements IdGenerator {
  next(): string {
    return randomUUID()
  }
}
