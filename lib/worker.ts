import { Queue, Worker, QueueScheduler } from 'bullmq'
import Redis from 'ioredis'
import redisClient from './redis'
import { prisma } from './prisma'
import { fetchVesselCoordinatesByIMO } from './providers'

const connection = { connection: redisClient }
const queueName = 'sync'

// ensure scheduler
new QueueScheduler(queueName, connection)
const queue = new Queue(queueName, connection)

// Worker that processes sync jobs
const worker = new Worker(
  queueName,
  async (job) => {
    const { bl } = job.data as { bl?: string }
    const searches = bl ? await prisma.search.findMany({ where: { blNumber: bl } }) : await prisma.search.findMany({ where: {}, take: 100 })

    for (const s of searches) {
      try {
        const result: any = s.result || {}
        const imo = result?.vessel?.imo
        if (!imo) continue
        const coords = await fetchVesselCoordinatesByIMO(imo, s.userId || undefined)
        if (coords) {
          result.vessel = result.vessel || {}
          result.vessel.coordinates = coords
          result.lastUpdated = new Date().toISOString()

          const cacheKey = `search:${s.blNumber}`
          await redisClient.set(cacheKey, JSON.stringify(result), 'EX', 60 * 5)
          await prisma.search.update({ where: { id: s.id }, data: { result: result as any, status: result.status || 'In Transit' } })
        }
      } catch (err) {
        // continue on errors
        continue
      }
    }
    return { ok: true, count: searches.length }
  },
  connection
)

worker.on('completed', (job) => {
  console.log('Sync job completed', job.id)
})

worker.on('failed', (job, err) => {
  console.error('Sync job failed', job?.id, err?.message)
})

export async function enqueueSync(bl?: string) {
  await queue.add('sync-job', { bl }, { removeOnComplete: true, removeOnFail: false })
}

// if run directly, start listening
if (require.main === module) {
  console.log('Worker started, listening for sync jobs')
}
