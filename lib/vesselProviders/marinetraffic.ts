import { IVesselTrackingProvider, NormalizedVesselInfo } from '../vesselProvider'
import { fetchMarineTrafficPosition } from '../marinetraffic'
import { decrypt } from '../crypto'
import { getEncryptionKey } from '../encryption'
import { prisma } from '../prisma'

const MarineTrafficProvider: IVesselTrackingProvider = {
  async getVesselByIMO(imo: string, userId?: string) {
    if (!imo) return null
    // find credentials for MarineTraffic for user
    const cred = userId ? await prisma.apiCredential.findFirst({ where: { userId, provider: { contains: 'MarineTraffic' } } }) : null
    const endpoint = cred?.endpoint || process.env.MARINETRAFFIC_ENDPOINT || ''
    let apiKey = cred?.apiKey || ''
    try { apiKey = decrypt(String(apiKey), getEncryptionKey()) } catch (e) {}

    const pos = await fetchMarineTrafficPosition(endpoint, String(apiKey), imo)
    if (!pos) return null

    return { imo, coordinates: { lat: pos.lat, lng: pos.lon }, provider: 'MarineTraffic' }
  },
  async getVesselByName(name: string) {
    // MarineTraffic often supports name-based search via separate endpoints; best-effort via endpoint param
    return null
  },
  async getCurrentPosition(imo: string) {
    return this.getVesselByIMO(imo)
  },
  async getVoyageInformation(imo: string) {
    // not implemented in depth — return basic info
    return this.getVesselByIMO(imo)
  }
}

export default MarineTrafficProvider
