import { prisma } from './prisma'
import redis from './redis'
import { NormalizedVesselInfo } from './vesselProvider'

export async function storeVesselPosition(v: NormalizedVesselInfo) {
  if (!v || !v.imo || !v.coordinates) return null
  try {
    await prisma.vesselPosition.create({ data: { imo: v.imo, name: v.name || undefined, latitude: v.coordinates.lat, longitude: v.coordinates.lng, speed: v.speed || undefined, heading: v.heading || undefined, destination: v.destination || undefined, eta: v.eta ? new Date(v.eta) : undefined, provider: v.provider || undefined } })
  } catch (e) {}
  try {
    const key = `vessel:${v.imo}`
    const payload = { imo: v.imo, name: v.name, coordinates: v.coordinates, speed: v.speed, heading: v.heading, destination: v.destination, eta: v.eta, provider: v.provider, lastUpdated: new Date().toISOString() }
    await redis.set(key, JSON.stringify(payload), 'EX', 60 * 5)
    // also write to tracking cache table
    try { await prisma.vesselTrackingCache.create({ data: { imo: v.imo, payload } }) } catch (er) {}
  } catch (e) {}
  return v
}

export async function getCachedVessel(imo: string) {
  try {
    const key = `vessel:${imo}`
    const v = await redis.get(key)
    if (v) return JSON.parse(v)
  } catch (e) {}
  return null
}
