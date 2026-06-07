import nock from 'nock'

jest.mock('../../lib/prisma', () => ({
  prisma: {
    apiCredential: {
      findFirst: jest.fn(async () => ({ id: '1', provider: 'CEVA', apiKey: 'key', endpoint: 'https://ceva.test/api/shipments' }))
    }
  }
}))

const { default: CEVAProvider } = require('../../lib/providers/ceva')

describe('CEVA provider', () => {
  afterEach(() => nock.cleanAll())

  test('parses successful CEVA response', async () => {
    const bl = 'CEVA123'
    const scope = nock('https://ceva.test').get('/api/shipments').query(true).reply(200, {
      vesselName: 'TEST VESSEL',
      imo: '7654321',
      voyageNumber: 'V99',
      bookingNumber: 'B123',
      containers: ['C1', 'C2'],
      pol: 'SHP',
      pod: 'DST',
      eta: '2026-07-01T00:00:00Z',
      events: [{ time: '2026-06-01', event: 'Loaded' }]
    })

    const res = await CEVAProvider.fetchByBL(bl, 'user1')
    expect(res).not.toBeNull()
    expect(res.blNumber).toBe(bl)
    expect(res.vessel?.name).toBe('TEST VESSEL')
    expect(res.vessel?.imo).toBe('7654321')
    expect(res.containers?.length).toBe(2)
  })

  test('handles empty response gracefully', async () => {
    const bl = 'CEVA_EMPTY'
    nock('https://ceva.test').get('/api/shipments').query(true).reply(200, null)
    const res = await CEVAProvider.fetchByBL(bl, 'user1')
    expect(res).toBeNull()
  })
})
