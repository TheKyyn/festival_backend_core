import type { Slot } from '../../../domain/entities/Slot'

export interface SlotView {
  id: string
  eventId: string
  startTime: string
  endTime: string
  capacity: number
  allowedRoles: string[]
}

export function toSlotView(slot: Slot): SlotView {
  return {
    id: slot.id,
    eventId: slot.eventId,
    startTime: slot.startTime.toISOString(),
    endTime: slot.endTime.toISOString(),
    capacity: slot.capacity,
    allowedRoles: slot.allowedRoles.map((role) => role.name),
  }
}
