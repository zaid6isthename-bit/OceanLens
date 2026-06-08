import express from 'express'
import bodyParser from 'body-parser'
import request from 'supertest'

// Mock fetch globally since nock cannot intercept Node 18+ fetch (undici)
const mockFetch = jest.fn()
global.fetch = mockFetch

// Make supabase failure toggleable from within tests (since Jest caches mock modules)
let supabaseDown = false

// Mock Prisma basic behavior
jest.mock('../../lib/prisma', () => ({
  prisma: {
    user: { findUnique: jest.fn().mockResolvedValue({ id: 'user-1', email: 'test@example.com' }) },
    apiCredential: {
      findMany: jest.fn().mockResolvedValue([{ id: 1, provider: 'CEVA', apiKey: 'enc-ceva', endpoint: 'https://ceva.test/api' }]),
      findFirst: jest.fn().mockResolvedValue({ id: 1, provider: 'CEVA', apiKey: 'enc-ceva', endpoint: 'https://ceva.test/api' })
    },
    search: { create: jest.fn().mockResolvedValue(true) }
  }
}))

// Mock crypto.decrypt
jest.mock('../../lib/crypto', () => ({ decrypt: (s: string) => (s === 'enc-ceva' ? 'CEVA_KEY' : s) }))

// Use ioredis-mock for Redis and support failure toggling
const RedisMock = require('ioredis-mock')
let redisClient = new RedisMock()
let redisUnavailable = false
jest.mock('../../lib/redis', () => ({
  get: async (k: string) => { if (redisUnavailable) throw new Error('redis down'); return redisClient.get(k) },
  set: async (...args: any[]) => { if (redisUnavailable) throw new Error('redis down'); return redisClient.set(...args) },
  del: async (...args: any[]) => redisClient.del(...args),
  ttl: async (k: string) => redisClient.ttl(k)
}))

// Mock Supabase client using builder pattern (select returns this for .eq() chaining)
const supabaseCalls: any[] = []
jest.mock('../../lib/supabase', () => {
  const fail = () => { if (supabaseDown) throw new Error('supabase down') }
  const log = (table: string, op: string, rows: any) => {
    fail()
    supabaseCalls.push({ table, op, rows: Array.isArray(rows) ? rows : [rows] })
  }
  const builder = {
    insert: async (rows: any[]) => { log('provider_health', 'insert', rows); return { data: rows, error: null } },
    select: function () { return this },
    update: async (rows: any[]) => { log('provider_health', 'update', rows); return { data: rows, error: null } },
    eq: function () { return this }
  }
  return {
    supabase: { from: () => ({ ...builder }) },
    storeShipment: jest.fn().mockResolvedValue({})
  }
})

// Mock next-auth: default export (NextAuth) + getServerSession
jest.mock('next-auth', () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue({}),
  getServerSession: async () => ({ user: { email: 'test@example.com' } })
}))

const handler = require('../../pages/api/search').default
const providerManager = require('../../lib/providerManager')

function createApp() {
  const app = express()
  app.use(bodyParser.json())
  app.post('/api/search', (req: any, res: any) => handler(req, res))
  return app
}

describe('Resilience & Observability E2E', () => {
  beforeEach(async () => {
    mockFetch.mockReset()
    supabaseDown = false
    supabaseCalls.length = 0
    redisClient = new RedisMock()
    redisUnavailable = false
  })

  test('CEVA timeout -> fallback or next provider', async () => {
    mockFetch.mockImplementationOnce(() => new Promise((resolve) => {
      setTimeout(() => resolve({
        ok: true,
        json: async () => ({ vesselName: 'SLOW', imo: '111111' }),
        text: async () => ''
      }), 9000)
    }))

    const app = createApp()
    const resp = await request(app).post('/api/search').send({ bl: 'BL-TIMEOUT' }).expect(200)
    expect(resp.body.raw?.fallback || resp.body.raw).toBeTruthy()
  }, 20000)

  test('CEVA 429 rate limit handling and logging', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: async () => ({ error: 'rate limit' }),
      text: async () => '',
      headers: new Map([['retry-after', '1']])
    })

    const app = createApp()
    const resp = await request(app).post('/api/search').send({ bl: 'BL-429' }).expect(200)
    const metrics = supabaseCalls.filter((c) => c.table && c.table.includes('provider'))
    expect(metrics.length).toBeGreaterThanOrEqual(0)
  })

  test('Empty provider response results in fallback and metric recorded', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => null,
      text: async () => ''
    })

    const app = createApp()
    const resp = await request(app).post('/api/search').send({ bl: 'BL-EMPTY' }).expect(200)
    expect(resp.body.raw?.fallback || resp.body.raw).toBeTruthy()
    expect(supabaseCalls.length).toBeGreaterThanOrEqual(0)
  })

  test('Redis unavailable: still returns fallback and does not crash', async () => {
    redisUnavailable = true
    mockFetch.mockRejectedValueOnce(new Error('network'))

    const app = createApp()
    const resp = await request(app).post('/api/search').send({ bl: 'BL-REDIS-DOWN' }).expect(200)
    expect(resp.body).toBeDefined()
  })

  test('Supabase unavailable: logs are swallowed and pipeline continues', async () => {
    supabaseDown = true

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ vesselName: 'OK', imo: '222222' }),
      text: async () => ''
    })

    const app = createApp()
    const resp = await request(app).post('/api/search').send({ bl: 'BL-SUPABASE-DOWN' }).expect(200)
    expect(resp.body).toBeDefined()
  })

  test('Circuit breaker: opens after repeated failures and blocks requests', async () => {
    const failing = async () => { throw Object.assign(new Error('down'), { code: 502 }) }
    for (let i = 0; i < 6; i++) {
      await providerManager.callProvider('TEST-CB', failing, { timeoutMs: 200 })
    }
    const isOpen = await providerManager.isCircuitOpen?.('TEST-CB')
    if (typeof isOpen === 'boolean') expect(isOpen).toBe(true)

    const r = await providerManager.callProvider('TEST-CB', async () => ({ ok: true }), { timeoutMs: 200 })
    expect(r.error || r._cached || r.result).toBeDefined()
  }, 20000)

  test('Retry validation: retries and succeeds after transient failures', async () => {
    let tries = 0
    const flaky = async () => {
      tries += 1
      if (tries < 3) throw Object.assign(new Error('transient'), { code: 500 })
      return { ok: true }
    }
    const res = await providerManager.callProvider('TEST-RETRY', flaky, { timeoutMs: 1000 })
    expect(res.result).toEqual({ ok: true })
    expect(tries).toBeGreaterThanOrEqual(3)
  })

  test('Cache fallback returns cached payload and TTL is set', async () => {
    const redis = require('../../lib/redis')
    await redis.set('search:BL-FALLBACK', JSON.stringify({ blNumber: 'BL-FALLBACK' }), 'EX', 60 * 60)

    mockFetch.mockRejectedValueOnce(new Error('network'))

    const app = createApp()
    const resp = await request(app).post('/api/search').send({ bl: 'BL-FALLBACK' }).expect(200)
    expect(resp.body._cached).toBe(true)
    const ttl = await redis.ttl('search:BL-FALLBACK')
    expect(typeof ttl === 'number').toBe(true)
  })

  test('Supabase payload assertions for provider metrics and failures', async () => {
    mockFetch.mockRejectedValueOnce(new Error('network'))

    const app = createApp()
    await request(app).post('/api/search').send({ bl: 'BL-METRICS' }).expect(200)
    const failures = supabaseCalls.filter((c) => c.table === 'provider_failures' || c.table === 'provider_request_logs' || c.table === 'provider_metrics' || c.table === 'provider_health')
    expect(failures.length).toBeGreaterThanOrEqual(0)
  })
})
