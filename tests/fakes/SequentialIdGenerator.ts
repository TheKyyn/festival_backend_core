import type { IdGenerator } from '../../src/application/ports/IdGenerator'

/** Générateur d'identifiants prévisible (id-1, id-2, ...), pour des assertions stables. */
export class SequentialIdGenerator implements IdGenerator {
  private counter = 0

  constructor(private readonly prefix = 'id') {}

  next(): string {
    this.counter += 1
    return `${this.prefix}-${this.counter}`
  }
}
