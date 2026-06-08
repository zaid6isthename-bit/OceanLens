import { IVesselTrackingProvider, NormalizedVesselInfo } from '../vesselProvider'
import { prisma } from '../prisma'
import { decrypt } from '../crypto'
import { getEncryptionKey } from '../encryption'

const VesselFinderProvider: IVesselTrackingProvider = {
  async getVesselByIMO(imo: string, userId?: string) {
    if (!imo) return null
    const cred = userId ? await prisma.apiCredential.findFirst({ where: { userId, provider: { contains: 'VesselFinder' } } }) : null
    const endpoint = cred?.endpoint || process.env.VESSELFINDER_ENDPOINT || ''
    let apiKey = cred?.apiKey || ''
    try { apiKey = decrypt(String(apiKey), getEncryptionKey()) } catch (e) {}

    if (!endpoint) return null
    try {
      const url = new URL(endpoint)
      if (!url.searchParams.has('imo')) url.searchParams.set('imo', imo)
      if (apiKey && !url.searchParams.has('apikey')) url.searchParams.set('apikey', apiKey)
      const resp = await fetch(url.toString(), { method: 'GET' })
      if (!resp.ok) return null
      const json = await resp.json().catch(() => null)
      if (!json) return null

      // normalize common shapes
      const coords = json.lat && json.lon ? { lat: Number(json.lat), lng: Number(json.lon) } : json.latitude && json.longitude ? { lat: Number(json.latitude), lng: Number(json.longitude) } : null
      return { imo, name: json.name || json.vessel || undefined, coordinates: coords || undefined, speed: json.speed ? Number(json.speed) : undefined, heading: json.heading ? Number(json.heading) : undefined, destination: json.destination || undefined, eta: json.eta || undefined, provider: 'VesselFinder' }
    } catch (err) {
      return null
    }
  },
  async getVesselByName(name: string) {
    return null
  },
  async getCurrentPosition(imo: string, userId?: string) {
    return this.getVesselByIMO(imo, userId)
  },
  async getVoyageInformation(imo: string, userId?: string) {
    return this.getVesselByIMO(imo, userId)
  }
}

export default VesselFinderProvider
