// Mock fetch globally since nock cannot intercept Node 18+ fetch (undici)
const mockFetch = jest.fn()
global.fetch = mockFetch

jest.mock('../../lib/prisma', () => ({
  prisma: {
    apiCredential: {
      findFirst: jest.fn(async () => ({ id: '2', provider: 'DSV', apiKey: 'key', endpoint: 'https://dsv.test/api/track' }))
    }
  }
}))

const { default: DSVProvider } = require('../../lib/providers/dsv')

describe('DSV provider', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  test('parses successful DSV response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        vessel_name: 'DSV VESSEL',
        imo_number: '1112223',
        voyage_no: 'D1',
        containers: ['X1'],
        pol: 'AAA',
        pod: 'BBB',
        eta: '2026-07-05T00:00:00Z',
        events: [{ time: '2026-06-02', event: 'Loaded' }]
      }),
      text: async () => ''
    })

    const res = await DSVProvider.fetchByBL('DSV123', 'user2')
    expect(res).not.toBeNull()
    expect(res.blNumber).toBe('DSV123')
    expect(res.vessel?.name).toBe('DSV VESSEL')
    expect(res.vessel?.imo).toBe('1112223')
  })

  test('invalid BL yields null', async () => {
    const res = await DSVProvider.fetchByBL('', 'user2')
    expect(res).toBeNull()
  })
})
