import { prisma } from '../../lib/prisma'
import { decrypt } from '../../lib/crypto'
import { ForwarderProvider, NormalizedShipment } from '../provider'

function parseDSVResponse(json: any, bl: string): NormalizedShipment | null {
  if (!json) return null
  // example fields: shipment, vessel_name, imo_number, voyage_no, containers
  const vessel: any = {}
  vessel.name = json.vessel_name || json.vessel || json.ship
  vessel.imo = json.imo_number || json.IMO || json.imo
  vessel.voyage = json.voyage_no || json.voyage

  const containers = json.containers || json.container_list || (json.shipment && json.shipment.containers)

  const normalized: NormalizedShipment = {
    blNumber: bl,
    bookingNumber: json.booking_no || json.booking || json.reference,
    containers: containers ? (Array.isArray(containers) ? containers : [containers]) : undefined,
    vessel: vessel.name || vessel.imo || vessel.voyage ? vessel : undefined,
    pol: json.pol || json.origin || json.load_port,
    pod: json.pod || json.destination || json.discharge_port,
    currentPort: json.current_port,
    nextPort: json.next_port,
    eta: json.eta || json.estimated_arrival,
    status: json.status || json.shipment_status || 'Unknown',
    timeline: json.events || json.history || undefined,
    raw: json
  }

  return normalized
}

const DSVProvider: ForwarderProvider = {
  async fetchByBL(bl: string, userId?: string) {
    const cred = userId ? await prisma.apiCredential.findFirst({ where: { userId, provider: { contains: 'DSV' } } }) : null
    if (!cred) return null

    const secret = process.env.NEXTAUTH_SECRET || 'dev-secret'
    let apiKey = String(cred.apiKey || '')
    try { apiKey = decrypt(apiKey, secret) } catch (e) {}
    const endpoint = cred.endpoint || ''
    if (!endpoint) return null

    try {
      const url = new URL(endpoint)
      if (!url.searchParams.has('bl')) url.searchParams.set('bl', bl)
      if (!url.searchParams.has('booking')) url.searchParams.set('booking', bl)
      if (apiKey && !url.searchParams.has('apikey')) url.searchParams.set('apikey', apiKey)

      const r = await fetch(url.toString(), { method: 'GET' })
      if (!r.ok) return null
      const json = await r.json().catch(() => null)
      const parsed = parseDSVResponse(json, bl)
      return parsed
    } catch (err) {
      return null
    }
  }
}

export default DSVProvider
