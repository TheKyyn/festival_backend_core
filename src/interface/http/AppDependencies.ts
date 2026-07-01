import type { RegisterUser } from '../../application/use-cases/auth/RegisterUser'
import type { LoginUser } from '../../application/use-cases/auth/LoginUser'
import type { RefreshTokens } from '../../application/use-cases/auth/RefreshTokens'
import type { LogoutUser } from '../../application/use-cases/auth/LogoutUser'
import type { GetProfile } from '../../application/use-cases/auth/GetProfile'
import type { CreateReservation } from '../../application/use-cases/reservation/CreateReservation'
import type { ListMyReservations } from '../../application/use-cases/reservation/ListMyReservations'
import type { CancelReservation } from '../../application/use-cases/reservation/CancelReservation'
import type { ValidateReservation } from '../../application/use-cases/reservation/ValidateReservation'
import type { CreateVenue } from '../../application/use-cases/catalog/CreateVenue'
import type { CreateEvent } from '../../application/use-cases/catalog/CreateEvent'
import type { CreateSlot } from '../../application/use-cases/catalog/CreateSlot'
import type { ListEvents } from '../../application/use-cases/catalog/ListEvents'
import type { GetEventSlots } from '../../application/use-cases/catalog/GetEventSlots'
import type { TokenService } from '../../application/ports/TokenService'

/**
 * Dépendances dont la couche HTTP a besoin. La couche interface déclare ce
 * qu'elle consomme (use cases + ports), sans connaître les implémentations
 * concrètes ni le conteneur qui les assemble.
 */
export interface AppDependencies {
  registerUser: RegisterUser
  loginUser: LoginUser
  refreshTokens: RefreshTokens
  logoutUser: LogoutUser
  getProfile: GetProfile
  createReservation: CreateReservation
  listMyReservations: ListMyReservations
  cancelReservation: CancelReservation
  validateReservation: ValidateReservation
  createVenue: CreateVenue
  createEvent: CreateEvent
  createSlot: CreateSlot
  listEvents: ListEvents
  getEventSlots: GetEventSlots
  tokenService: TokenService
}
