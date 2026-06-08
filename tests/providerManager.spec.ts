// Mock supabase and redis to prevent real client creation (can hang without running services)
jest.mock('../lib/supabase', () => ({
  supabase: {
    from: () => ({
      insert: async () => ({ data: null, error: null }),
      select: async () => ({ data: [], error: null }),
      update: async () => ({ data: null, error: null }),
      eq: () => ({ insert: async () => ({ data: null, error: null }) })
    })
  },
  storeShipment: jest.fn()
}))

jest.mock('../lib/redis', () => ({
  __esModule: true,
  default: {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK')
  }
}))

import { callProvider, markProviderSuccess, isCircuitOpen } from '../lib/providerManager'

describe('providerManager', () => {
  test('callProvider succeeds and returns wrapped value', async () => {
    const result: any = await callProvider('mock', async () => ({ ok: true }), { timeoutMs: 2000 })
    expect(result.result).toEqual({ ok: true })
  })

  test('callProvider retries on transient failure then succeeds', async () => {
    let tries = 0
    const fn = async () => {
      tries += 1
      if (tries < 3) throw Object.assign(new Error('transient'), { code: 500 })
      return { ok: true }
    }
    const res: any = await callProvider('mock-retry', fn, { timeoutMs: 2000 })
    expect(res.result).toEqual({ ok: true })
    expect(tries).toBeGreaterThanOrEqual(3)
  }, 10000)

  test('timeout scenario returns error and does not hang', async () => {
    const slow = () => new Promise((res) => setTimeout(() => res('ok'), 2000))
    const r: any = await callProvider('__test_timeout', slow, { timeoutMs: 200 })
    expect(r).toHaveProperty('error')
  })

  test('circuit breaker opens after repeated failures', async () => {
    const failing = () => Promise.reject(new Error('server error'))
    for (let i = 0; i < 6; i++) {
      await callProvider('__test_circuit', failing, { timeoutMs: 500 }).catch(() => {})
    }
    const r: any = await callProvider('__test_circuit', failing, { timeoutMs: 500 })
    expect(r).toHaveProperty('error')

    const open = await isCircuitOpen('__test_circuit')
    if (typeof open === 'boolean') expect(open).toBe(true)
    else expect(open).toBeDefined()
  }, 30000)

  test('marks provider success cache', async () => {
    markProviderSuccess('TESTPROV', { some: 'data' })
  })
})
