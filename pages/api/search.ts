import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../lib/prisma'
import redis from '../../lib/redis'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth/[...nextauth]'
import { fetchVesselCoordinatesByIMO } from '../../lib/providers'
import { fetchFromForwarders } from '../../lib/providers/index'
import { getVesselInfoByIMO } from '../../lib/vesselProviders'
import { storeVesselPosition, getCachedVessel } from '../../lib/vesselService'
import { storeShipment } from '../../lib/supabase'
import { NormalizedShipment } from '../../lib/provider'
import { rateLimit } from '../../lib/rateLimit'

// This endpoint orchestrates BL lookup across forwarder APIs and vessel trackers.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const allowed = await rateLimit('search', 60, 60000)
  if (!allowed) return res.status(429).json({ error: 'Too many requests' })

  const bl = String(req.query.bl || req.body.bl || '')
  if (!bl) return res.status(400).json({ error: 'Missing bl parameter' })

  const session = await getServerSession(req, res, authOptions)
  const userEmail = session?.user?.email
  const user = userEmail ? await prisma.user.findUnique({ where: { email: userEmail } }) : null
  const userId = user?.id

  const cacheKey = `search:${bl}`
  try {
    const cached = await redis.get(cacheKey)
    if (cached) {
      const parsed = JSON.parse(cached)
      parsed._cached = true
      return res.json(parsed)
    }
  } catch (err) {
    // ignore redis errors and continue
  }

  // Try pipeline: forwarder providers -> normalize -> vessel tracker lookup -> cache/store

  let normalized: NormalizedShipment | null = null

  // Attempt to fetch from forwarder providers (auto-detect & prioritize user credentials)
  try {
    const found = await fetchFromForwarders(bl, userId || undefined)
    if (found && found.result) normalized = found.result
  } catch (err) {
    normalized = null
  }

  // If no forwarder data found, create mock fallback
  if (!normalized) {
    normalized = {
      blNumber: bl,
      status: 'In Transit',
      vessel: { name: 'MSC EXEMPLAR', imo: '1234567', voyage: 'V001', coordinates: { lat: 22.5, lng: 14.3 } },
      eta: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
      raw: { fallback: true }
    }
  }

  // attempt vessel tracker lookup by IMO using providerManager-aware tracker callers
  try {
    const imo = normalized.vessel?.imo
    if (imo) {
      // try cached vessel
      const cached = await getCachedVessel(String(imo))
      if (cached) {
        normalized.vessel = { ...normalized.vessel, coordinates: { lat: cached.coordinates.lat, lng: cached.coordinates.lng } }
      } else {
        const info = await getVesselInfoByIMO(String(imo), userId)
        if (info) {
          normalized.vessel = { ...normalized.vessel, ...info }
          // persist position + cache
          try { await storeVesselPosition(info) } catch (e) {}
        } else {
          const coords = await fetchVesselCoordinatesByIMO(String(imo), userId)
          if (coords) {
            if (!normalized.vessel) normalized.vessel = {}
            normalized.vessel.coordinates = coords
          }
        }
      }
    }
  } catch (err) {
    // ignore tracking errors
  }

  // persist search in Postgres for history
  try {
    await prisma.search.create({ data: { blNumber: bl, status: normalized.status || 'In Transit', userId: userId || '', result: normalized as any } }).catch(() => {})
  } catch (err) {}

  // store normalized shipment in Supabase (best-effort)
  try {
    await storeShipment({ bl, provider: 'CEVA', data: normalized })
  } catch (err) {}

  // cache in redis for 5 minutes
  try {
    await redis.set(cacheKey, JSON.stringify(normalized), 'EX', 60 * 5)
  } catch (err) {}

  res.json(normalized)
}
