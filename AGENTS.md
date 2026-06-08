# Conventions for this project

## Testing
- Run: `npx jest --coverage`
- Build: `npx next build`
- Provider unit tests must mock `global.fetch` (not nock), since Node 18+ fetch (undici) is not intercepted by nock.
- E2E tests using supertest + express must mock `global.fetch` the same way.
- `jest.mock()` calls use string literal paths (e.g. `'../../lib/prisma'`) instead of `path.resolve()`, because `jest.mock` is hoisted above `const` declarations (avoiding Temporal Dead Zone issues).
- Mock `next-auth` with `{ __esModule: true, default: jest.fn(), getServerSession: async () => ... }` to satisfy both default and named imports.
- Mock supabase using a builder pattern where `.select()` returns `this` for `.eq()` chaining.
- Use flags (e.g. `supabaseDown`, `redisUnavailable`) in mock closures to toggle failure modes in tests.
- Module-level mocks for `redis` and `supabase` must be used when testing modules that import them directly, to prevent real connection attempts from hanging.

## Environment
- `ENCRYPTION_KEY` must be >=32 chars; falls back to `NEXTAUTH_SECRET`.
- Node.js 18+ required (uses global `fetch`, `AbortController`).
- Redis and PostgreSQL required at runtime.
