import { prisma } from '../../lib/prisma'
import { decrypt } from '../../lib/crypto'
import { ForwarderProvider, NormalizedShipment } from '../provider'

function tryParseShipment(json: any, bl: string): NormalizedShipment | null {
  if (!json) return null
  // Best-effort parsing based on common forwarder response fields
  const vessel = {} as any
  vessel.name = json.vesselName || json.vessel || json.shipName || json.vessel_name
  vessel.imo = json.imo || json.IMO || json.vesselIMO
  vessel.voyage = json.voyageNumber || json.voyage || json.voyage_no

  const containers = json.containers || json.containerNumbers || (json.containersList && Array.isArray(json.containersList) ? json.containersList : undefined)

  const normalized: NormalizedShipment = {
    blNumber: bl,
    bookingNumber: json.bookingNumber || json.booking || json.booking_no,
    containers: containers ? (Array.isArray(containers) ? containers : [containers]) : undefined,
    vessel: vessel.imo || vessel.name || vessel.voyage ? vessel : undefined,
    pol: json.pol || json.origin || json.loadPort,
    pod: json.pod || json.destination || json.dischargePort,
    currentPort: json.currentPort,
    nextPort: json.nextPort,
    eta: json.eta || json.estimatedArrival,
    status: json.status || json.shipmentStatus || 'Unknown',
    timeline: json.events || json.timeline || undefined,
    raw: json
  }

  return normalized
}

const CEVAProvider: ForwarderProvider = {
  async fetchByBL(bl: string, userId?: string) {
    // find CEVA credentials
    const cred = userId ? await prisma.apiCredential.findFirst({ where: { userId, provider: { contains: 'CEVA' } } }) : null
    if (!cred) return null

    const secret = process.env.NEXTAUTH_SECRET || 'dev-secret'
    let apiKey = String(cred.apiKey || '')
    try { apiKey = decrypt(apiKey, secret) } catch (e) {}
    const endpoint = cred.endpoint || ''
    if (!endpoint) return null

    try {
      const url = new URL(endpoint)
      // CEVA APIs may accept 'bl' or 'booking' param; set both if absent
      if (!url.searchParams.has('bl')) url.searchParams.set('bl', bl)
      if (!url.searchParams.has('booking')) url.searchParams.set('booking', bl)
      if (apiKey && !url.searchParams.has('apikey')) url.searchParams.set('apikey', apiKey)

      const r = await fetch(url.toString(), { method: 'GET' })
      if (!r.ok) return null
      const json = await r.json().catch(() => null)
      const parsed = tryParseShipment(json, bl)
      return parsed
    } catch (err) {
      return null
    }
  }
}

export default CEVAProvider
