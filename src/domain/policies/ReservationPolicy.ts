/**
 * Paramètres/règles métier centralisés et purs.
 * Les isoler ici les rend testables et modifiables sans toucher aux use cases.
 */
export const ReservationPolicy = {
  /**
   * Nombre maximum de réservations ACTIVES qu'un utilisateur peut détenir
   * simultanément, tous événements confondus (quota global par utilisateur).
   */
  MAX_ACTIVE_RESERVATIONS_PER_USER: 3,
} as const
