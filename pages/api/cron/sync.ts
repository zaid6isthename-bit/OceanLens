import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import redis from '../../../lib/redis'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'

// Trigger a manual sync for a specific BL or for all recent searches.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session?.user?.email) return res.status(401).json({ error: 'Not authenticated' })

  if (req.method !== 'POST') return res.status(405).end()
  const { bl } = req.body

  const searches = bl ? await prisma.search.findMany({ where: { blNumber: bl } }) : await prisma.search.findMany({ where: {}, take: 100 })

  // In a full implementation: schedule background workers to call provider APIs and vessel trackers.
  // Here we simply refresh the cached fake data and update redis TTL.

  const results: any[] = []
  for (const s of searches) {
    const cacheKey = `search:${s.blNumber}`
    const fake = { bl: s.blNumber, status: s.status || 'In Transit', vessel: { name: 'MSC EXEMPLAR', imo: '1234567', voyage: 'V001', coordinates: { lat: 22.5, lng: 14.3 } }, eta: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), lastUpdated: new Date().toISOString() }
    try {
      await redis.set(cacheKey, JSON.stringify(fake), 'EX', 60 * 5)
    } catch (err) {}
    results.push({ bl: s.blNumber, ok: true })
  }

  res.json({ ok: true, refreshed: results.length })
}
