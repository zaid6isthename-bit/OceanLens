import nock from 'nock'

jest.mock('../../lib/prisma', () => ({
  prisma: {
    apiCredential: {
      findFirst: jest.fn(async () => ({ id: '2', provider: 'DSV', apiKey: 'key', endpoint: 'https://dsv.test/api/track' }))
    }
  }
}))

const { default: DSVProvider } = require('../../lib/providers/dsv')

describe('DSV provider', () => {
  afterEach(() => nock.cleanAll())

  test('parses successful DSV response', async () => {
    const bl = 'DSV123'
    nock('https://dsv.test').get('/api/track').query(true).reply(200, {
      vessel_name: 'DSV VESSEL',
      imo_number: '1112223',
      voyage_no: 'D1',
      containers: ['X1'],
      pol: 'AAA',
      pod: 'BBB',
      eta: '2026-07-05T00:00:00Z',
      events: [{ time: '2026-06-02', event: 'Loaded' }]
    })

    const res = await DSVProvider.fetchByBL(bl, 'user2')
    expect(res).not.toBeNull()
    expect(res.blNumber).toBe(bl)
    expect(res.vessel?.name).toBe('DSV VESSEL')
    expect(res.vessel?.imo).toBe('1112223')
  })

  test('invalid BL yields null', async () => {
    const bl = ''
    const res = await DSVProvider.fetchByBL(bl, 'user2')
    expect(res).toBeNull()
  })
})
