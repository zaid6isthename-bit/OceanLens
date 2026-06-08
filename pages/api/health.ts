import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../lib/prisma'
import redis from '../../lib/redis'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const checks: Record<string, string> = {}

  // Check database
  try {
    await prisma.$queryRaw`SELECT 1`
    checks.database = 'ok'
  } catch {
    checks.database = 'error'
  }

  // Check Redis
  try {
    await redis.ping()
    checks.redis = 'ok'
  } catch {
    checks.redis = 'error'
  }

  const healthy = Object.values(checks).every((s) => s === 'ok')
  res.status(healthy ? 200 : 503).json({ status: healthy ? 'healthy' : 'degraded', checks })
}
