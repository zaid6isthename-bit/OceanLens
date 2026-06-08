// Mock fetch globally since nock cannot intercept Node 18+ fetch (undici)
const mockFetch = jest.fn()
global.fetch = mockFetch

jest.mock('../../lib/prisma', () => ({
  prisma: {
    apiCredential: {
      findFirst: jest.fn(async () => ({ id: '1', provider: 'CEVA', apiKey: 'key', endpoint: 'https://ceva.test/api/shipments' }))
    }
  }
}))

const { default: CEVAProvider } = require('../../lib/providers/ceva')

describe('CEVA provider', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  test('parses successful CEVA response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        vesselName: 'TEST VESSEL',
        imo: '7654321',
        voyageNumber: 'V99',
        bookingNumber: 'B123',
        containers: ['C1', 'C2'],
        pol: 'SHP',
        pod: 'DST',
        eta: '2026-07-01T00:00:00Z',
        events: [{ time: '2026-06-01', event: 'Loaded' }]
      }),
      text: async () => ''
    })

    const res = await CEVAProvider.fetchByBL('CEVA123', 'user1')
    expect(res).not.toBeNull()
    expect(res.blNumber).toBe('CEVA123')
    expect(res.vessel?.name).toBe('TEST VESSEL')
    expect(res.vessel?.imo).toBe('7654321')
    expect(res.containers?.length).toBe(2)
  })

  test('handles empty response gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => null,
      text: async () => ''
    })

    const res = await CEVAProvider.fetchByBL('CEVA_EMPTY', 'user1')
    expect(res).toBeNull()
  })
})
