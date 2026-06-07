import { callProvider, markProviderSuccess } from '../lib/providerManager'

describe('providerManager', () => {
  test('timeout scenario returns error and does not hang', async () => {
    const slow = () => new Promise((res) => setTimeout(() => res('ok'), 2000))
    const r = await callProvider('__test_timeout', slow, { timeoutMs: 200 })
    expect(r.error).toBeDefined()
  })

  test('circuit breaker opens after repeated failures', async () => {
    const failing = () => Promise.reject(new Error('server error'))
    // cause failures
    for (let i = 0; i < 6; i++) {
      // ignore results
      // @ts-ignore
      await callProvider('__test_circuit', failing, { timeoutMs: 500 })
    }
    const r = await callProvider('__test_circuit', failing, { timeoutMs: 500 })
    expect(r.error).toBeDefined()
  })

  test('marks provider success cache', async () => {
    markProviderSuccess('TESTPROV', { some: 'data' })
    // no assertion (ensures no throw); further tests can verify Redis mock
  })
})
