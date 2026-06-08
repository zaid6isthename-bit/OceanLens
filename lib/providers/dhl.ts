import { prisma } from '../../lib/prisma'
import { decrypt } from '../../lib/crypto'
import { getEncryptionKey } from '../../lib/encryption'
import { ForwarderProvider, NormalizedShipment } from '../provider'

function parseDHLResponse(json: any, bl: string): NormalizedShipment | null {
  if (!json) return null
  const vessel: any = {}
  vessel.name = json.vesselName || json.vessel || json.shipName
  vessel.imo = json.imo || json.imoNumber
  vessel.voyage = json.voyageNumber || json.voyage

  const containers = json.containers || json.containerNumbers || json.equipment

  const normalized: NormalizedShipment = {
    blNumber: bl,
    bookingNumber: json.bookingNumber || json.bookingReference,
    containers: containers ? (Array.isArray(containers) ? containers : [containers]) : undefined,
    vessel: vessel.name || vessel.imo || vessel.voyage ? vessel : undefined,
    pol: json.portOfLoading || json.origin || json.pol,
    pod: json.portOfDischarge || json.destination || json.pod,
    currentPort: json.currentLocation,
    nextPort: json.nextPort,
    eta: json.estimatedDelivery || json.eta,
    status: json.status || json.shipmentStatus || 'Unknown',
    timeline: json.events || json.timeline || undefined,
    raw: json
  }
  return normalized
}

const DHLProvider: ForwarderProvider = {
  async fetchByBL(bl: string, userId?: string) {
    const cred = userId ? await prisma.apiCredential.findFirst({ where: { userId, provider: { contains: 'DHL' } } }) : null
    if (!cred) return null

    let apiKey = String(cred.apiKey || '')
    try { apiKey = decrypt(apiKey, getEncryptionKey()) } catch (e) {}
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
      return parseDHLResponse(json, bl)
    } catch (err) {
      return null
    }
  }
}

export default DHLProvider
