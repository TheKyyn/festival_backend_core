export interface VenueProps {
  id: string
  name: string
  address: string
  capacity: number
}

/** Entité Venue (lieu du festival : galerie, salle d'exposition...). Domaine pur. */
export class Venue {
  readonly id: string
  readonly name: string
  readonly address: string
  readonly capacity: number

  constructor(props: VenueProps) {
    this.id = props.id
    this.name = props.name
    this.address = props.address
    this.capacity = props.capacity
  }
}
