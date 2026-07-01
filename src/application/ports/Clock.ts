/**
 * Port : source de temps injectable.
 * Rend les règles temporelles (créneau passé, conflit) déterministes en test.
 * Implémentation réelle (System clock) en infrastructure ; FakeClock en test.
 */
export interface Clock {
  now(): Date
}
