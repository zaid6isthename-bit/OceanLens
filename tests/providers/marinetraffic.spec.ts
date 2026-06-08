// Mock fetch globally since nock cannot intercept Node 18+ fetch (undici)
const mockFetch = jest.fn()
global.fetch = mockFetch

import { fetchMarineTrafficPosition } from '../../lib/marinetraffic'

describe('MarineTraffic provider helper', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  test('parses JSON lat/lon response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify([{ LAT: '10.5', LON: '20.5' }])
    })

    const res = await fetchMarineTrafficPosition('https://mt.test/pos', 'KEY', '123')
    expect(res).toEqual({ lat: 10.5, lon: 20.5 })
  })

  test('parses CSV response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => '10.1,20.2\n'
    })

    const res = await fetchMarineTrafficPosition('https://mt.test/csv', 'KEY', '123')
    expect(res).toEqual({ lat: 10.1, lon: 20.2 })
  })
})
