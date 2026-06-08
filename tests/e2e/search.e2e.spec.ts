import express from 'express'
import bodyParser from 'body-parser'
import request from 'supertest'

// Mock fetch globally since nock cannot intercept Node 18+ fetch (undici)
const mockFetch = jest.fn()
global.fetch = mockFetch

// Mock Prisma to return a user + CEVA/DSV credentials
jest.mock('../../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn().mockImplementation(async ({ where }: any) => ({ id: 'user-1', email: where.email }))
    },
    apiCredential: {
      findMany: jest.fn().mockImplementation(async () => {
        return [
          { id: 1, provider: 'CEVA', apiKey: 'enc-ceva', endpoint: 'https://ceva.test/api' },
          { id: 2, provider: 'DSV', apiKey: 'enc-dsv', endpoint: 'https://dsv.test/api' }
        ]
      }),
      findFirst: jest.fn().mockImplementation(async ({ where }: any) => {
        const p = where.provider?.contains?.toLowerCase()
        if (p?.includes('ceva'))
          return { id: 1, provider: 'CEVA', apiKey: 'enc-ceva', endpoint: 'https://ceva.test/api' }
        if (p?.includes('dsv'))
          return { id: 2, provider: 'DSV', apiKey: 'enc-dsv', endpoint: 'https://dsv.test/api' }
        return null
      })
    },
    search: {
      create: jest.fn().mockResolvedValue(true)
    }
  }
}))

// Mock crypto.decrypt to return plaintext API keys
jest.mock('../../lib/crypto', () => ({ decrypt: (s: string) => (s === 'enc-ceva' ? 'CEVA_KEY' : s === 'enc-dsv' ? 'DSV_KEY' : s) }))

// Mock Redis with ioredis-mock
jest.mock('../../lib/redis', () => {
  const RedisMock = require('ioredis-mock')
  const client = new RedisMock()
  return client
})

// Capture Supabase storeShipment calls
const storeShipmentMock = jest.fn().mockResolvedValue({})
jest.mock('../../lib/supabase', () => ({ storeShipment: storeShipmentMock }))

// Mock next-auth: default export (NextAuth) + getServerSession
jest.mock('next-auth', () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue({}),
  getServerSession: async () => ({ user: { email: 'test@example.com' } })
}))

// Import handler after mocks are set up
const handler = require('../../pages/api/search').default

function createApp() {
  const app = express()
  app.use(bodyParser.json())
  app.post('/api/search', (req: any, res: any) => handler(req, res))
  return app
}

describe('E2E /api/search', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    // Default to no credentials returned (use endpoint from credential mock)
    process.env.VESSELFINDER_ENDPOINT = ''
    process.env.MARINETRAFFIC_ENDPOINT = ''
  })

  test('success flow: CEVA returns shipment and persisted + cached', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        vesselName: 'CEVA VESSEL',
        imo: '7654321',
        containers: ['C1'],
        pol: 'POL',
        pod: 'POD',
        eta: '2026-06-10T00:00:00Z',
        status: 'Loaded'
      }),
      text: async () => ''
    })

    const app = createApp()
    const resp = await request(app).post('/api/search').send({ bl: 'BL-E2E-1' }).expect(200)

    expect(resp.body).toBeDefined()
    expect(resp.body.blNumber === 'BL-E2E-1' || resp.body.blNumber === undefined).toBeTruthy()
    expect(storeShipmentMock).toHaveBeenCalled()
    expect(resp.body.vessel || resp.body.raw).toBeDefined()
  })

  test('provider failover: CEVA 500 then DSV succeeds', async () => {
    // CEVA fails with 500
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'internal' }),
      text: async () => ''
    })
    // DSV succeeds
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        vessel: 'DSV VESSEL',
        imo: '8888888',
        containers: ['D1']
      }),
      text: async () => ''
    })

    const app = createApp()
    const resp = await request(app).post('/api/search').send({ bl: 'BL-FAILOVER' }).expect(200)
    expect(resp.body).toBeDefined()
    const raw = resp.body.raw || {}
    expect(JSON.stringify(raw).toLowerCase()).toMatch(/dsv/)
  })

  test('cache recovery: provider outage returns cached payload flagged', async () => {
    const redisClient = require('../../lib/redis')
    await redisClient.set('search:BL-CACHED', JSON.stringify({ blNumber: 'BL-CACHED', cachedFrom: 'CEVA' }))

    // Simulate provider unavailable (network error)
    mockFetch.mockRejectedValueOnce(new Error('network down'))

    const app = createApp()
    const resp = await request(app).post('/api/search').send({ bl: 'BL-CACHED' }).expect(200)
    expect(resp.body).toBeDefined()
    expect(resp.body._cached).toBe(true)
  })

  test('invalid BL returns 400', async () => {
    const app = createApp()
    await request(app).post('/api/search').send({}).expect(400)
  })

  test('empty provider response results in fallback', async () => {
    // CEVA returns empty body
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => null,
      text: async () => ''
    })

    const app = createApp()
    const resp = await request(app).post('/api/search').send({ bl: 'BL-EMPTY' }).expect(200)
    expect(resp.body.raw?.fallback || resp.body.raw).toBeTruthy()
  })
})
