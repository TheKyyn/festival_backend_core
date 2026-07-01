import type { Clock } from '../../application/ports/Clock'

/** Adapter réel du port Clock : renvoie l'heure système courante. */
export class SystemClock implements Clock {
  now(): Date {
    return new Date()
  }
}
