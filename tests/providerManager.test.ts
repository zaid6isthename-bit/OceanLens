// Basic test scaffolding for providerManager behaviors.
// These are simple node-run test stubs; run with `node tests/providerManager.test.ts` or integrate into Jest.
import { callProvider, markProviderSuccess } from '../lib/providerManager'

async function testTimeout() {
  console.log('test: timeout handling')
  const r = await callProvider('__test_timeout', () => new Promise((res) => setTimeout(() => res('ok'), 3000)), { timeoutMs: 500 })
  console.log('result', r)
}

async function run() {
  await testTimeout()
}

run().catch((e) => console.error(e))
