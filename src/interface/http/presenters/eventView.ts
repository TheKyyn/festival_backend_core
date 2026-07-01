import type { Event } from '../../../domain/entities/Event'

export interface EventView {
  id: string
  title: string
  description: string
  venueId: string
  organizerId: string
  startDate: string
  endDate: string
}

export function toEventView(event: Event): EventView {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    venueId: event.venueId,
    organizerId: event.organizerId,
    startDate: event.startDate.toISOString(),
    endDate: event.endDate.toISOString(),
  }
}
