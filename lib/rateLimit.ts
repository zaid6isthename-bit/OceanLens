import redis from './redis'

export async function rateLimit(key: string, maxRequests: number, windowMs: number): Promise<boolean> {
  try {
    const now = Date.now()
    const windowStart = now - windowMs
    await redis.zremrangebyscore(key, 0, windowStart)
    const count = await redis.zcard(key)
    if (count >= maxRequests) return false
    await redis.zadd(key, now, `${now}-${Math.random()}`)
    await redis.expire(key, Math.ceil(windowMs / 1000))
    return true
  } catch {
    return true
  }
}
