import type { Clock } from '../../src/application/ports/Clock'

/** Horloge figée et contrôlable, pour rendre les tests temporels déterministes. */
export class FakeClock implements Clock {
  constructor(private current: Date) {}

  now(): Date {
    return this.current
  }

  set(date: Date): void {
    this.current = date
  }
}
