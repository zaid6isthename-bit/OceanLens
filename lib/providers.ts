import { prisma } from './prisma'
import { decrypt } from './crypto'
import { fetchMarineTrafficPosition } from './marinetraffic'

type Coord = { lat: number; lng: number } | null

export async function fetchVesselCoordinatesByIMO(imo: string, userId?: string): Promise<Coord> {
  if (!imo) return null
  const creds = userId ? await prisma.apiCredential.findMany({ where: { userId } }) : []
  const candidates = creds.filter((c) => /MarineTraffic|VesselFinder|FleetMon|ShipAtlas/i.test(c.provider))

  for (const c of candidates) {
    try {
      const endpoint = c.endpoint || ''
      if (!endpoint) continue

      // decrypt stored keys if encrypted
      const secret = process.env.NEXTAUTH_SECRET || 'dev-secret'
      let apiKey = String(c.apiKey || '')
      try {
        apiKey = decrypt(apiKey, secret)
      } catch (e) {
        // if decrypt fails, assume stored value is plain
      }

      const url = new URL(endpoint)
      // common param names
      if (!url.searchParams.has('imo')) url.searchParams.set('imo', imo)
      if (apiKey && !url.searchParams.has('apikey') && !url.searchParams.has('key') && !url.searchParams.has('token')) {
        url.searchParams.set('apikey', apiKey)
      }

      // If provider is MarineTraffic, use specialized parser
      if (/MarineTraffic/i.test(c.provider)) {
        const mt = await fetchMarineTrafficPosition(endpoint, apiKey, imo)
        if (mt) return { lat: mt.lat, lng: mt.lon }
        continue
      }

      const res = await fetch(url.toString(), { method: 'GET' })
      if (!res.ok) continue
      const json = await res.json().catch(() => null)
      if (!json) continue

      // common shapes
      if (json.lat && json.lon) return { lat: Number(json.lat), lng: Number(json.lon) }
      if (json.latitude && json.longitude) return { lat: Number(json.latitude), lng: Number(json.longitude) }
      if (json.data && Array.isArray(json.data) && json.data[0]) {
        const first = json.data[0]
        if (first.latitude && first.longitude) return { lat: Number(first.latitude), lng: Number(first.longitude) }
        if (first.lat && first.lon) return { lat: Number(first.lat), lng: Number(first.lon) }
      }

      const maybe = findLatLngInObject(json)
      if (maybe) return maybe
    } catch (err) {
      continue
    }
  }

  return null
}

function findLatLngInObject(obj: any): Coord {
  if (!obj || typeof obj !== 'object') return null
  // shallow scan for lat/lon-like keys
  const latKeys = ['lat', 'latitude', 'LAT', 'Latitude']
  const lonKeys = ['lon', 'lng', 'longitude', 'LON', 'Longitude']

  for (const lk of latKeys) {
    for (const rk of lonKeys) {
      if (obj[lk] !== undefined && obj[rk] !== undefined) {
        const lat = Number(obj[lk])
        const lng = Number(obj[rk])
        if (!Number.isNaN(lat) && !Number.isNaN(lng)) return { lat, lng }
      }
    }
  }

  for (const k of Object.keys(obj)) {
    const v = obj[k]
    if (v && typeof v === 'object') {
      const nested = findLatLngInObject(v)
      if (nested) return nested
    }
  }
  return null
}
