// Mock fetch globally since nock cannot intercept Node 18+ fetch (undici)
const mockFetch = jest.fn()
global.fetch = mockFetch

jest.mock('../../lib/prisma', () => ({
  prisma: {
    apiCredential: {
      findFirst: jest.fn().mockResolvedValue(null)
    }
  }
}))

import VesselFinderProvider from '../../lib/vesselProviders/vesselfinder'

describe('VesselFinder provider', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  test('getVesselByIMO normalizes response', async () => {
    // Set env endpoint since no credentials returned
    process.env.VESSELFINDER_ENDPOINT = 'https://vesselfinder.test/api'

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ name: 'VF', lat: '11.1', lon: '22.2', speed: '13.3', heading: '180', destination: 'POD' }),
      text: async () => ''
    })

    const res = await VesselFinderProvider.getVesselByIMO('111111')
    expect(res).toBeDefined()
    expect(res!.coordinates).toEqual({ lat: 11.1, lng: 22.2 })
    expect(res!.name).toBe('VF')
  })
})
