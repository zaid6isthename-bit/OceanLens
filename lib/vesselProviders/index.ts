import MarineTrafficProvider from './marinetraffic'
import VesselFinderProvider from './vesselfinder'
import { IVesselTrackingProvider, NormalizedVesselInfo } from '../vesselProvider'
import { callProvider } from '../providerManager'

const providers: Array<{ name: string; impl: IVesselTrackingProvider }> = [
  { name: 'MarineTraffic', impl: MarineTrafficProvider },
  { name: 'VesselFinder', impl: VesselFinderProvider }
]

export async function getVesselInfoByIMO(imo: string, userId?: string): Promise<NormalizedVesselInfo | null> {
  if (!imo) return null
  for (const p of providers) {
    try {
      const res = await callProvider(p.name, () => p.impl.getVesselByIMO(imo, userId), { timeoutMs: 5000 })
      if (res && res.result) {
        const out = res.result as NormalizedVesselInfo
        out.provider = p.name
        return out
      }
      if (res && res._cached && res.result) return res.result
    } catch (err) {
      continue
    }
  }
  return null
}

export default providers
