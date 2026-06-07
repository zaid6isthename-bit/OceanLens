// polyfill fetch for tests using node-fetch
import fetch from 'node-fetch'

// @ts-ignore
global.fetch = fetch

// silence console during tests for clarity
beforeAll(() => {
  // keep
})
