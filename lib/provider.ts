export type Coord = { lat: number; lng: number }

export type TimelineEvent = { time?: string; event: string }

export type NormalizedShipment = {
  blNumber: string
  bookingNumber?: string
  containers?: string[]
  vessel?: { name?: string; imo?: string; voyage?: string; coordinates?: Coord }
  pol?: string
  pod?: string
  currentPort?: string
  nextPort?: string
  eta?: string
  status?: string
  timeline?: TimelineEvent[]
  raw?: any
}

export interface ForwarderProvider {
  fetchByBL(bl: string, userId?: string): Promise<NormalizedShipment | null>
}
