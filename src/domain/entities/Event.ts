export interface EventProps {
  id: string
  title: string
  description: string
  venueId: string
  organizerId: string
  startDate: Date
  endDate: Date
  createdAt: Date
}

/** Entité Event (exposition / événement du festival). Domaine pur. */
export class Event {
  readonly id: string
  readonly title: string
  readonly description: string
  readonly venueId: string
  readonly organizerId: string
  readonly startDate: Date
  readonly endDate: Date
  readonly createdAt: Date

  constructor(props: EventProps) {
    this.id = props.id
    this.title = props.title
    this.description = props.description
    this.venueId = props.venueId
    this.organizerId = props.organizerId
    this.startDate = props.startDate
    this.endDate = props.endDate
    this.createdAt = props.createdAt
  }
}
