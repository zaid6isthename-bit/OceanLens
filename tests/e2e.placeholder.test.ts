/*
  Placeholder E2E tests for the BL search -> provider -> cache -> persistence pipeline.
  These tests are intentionally skipped until infra/mocks are wired.
  They serve as a checklist for full implementation.
*/
describe.skip('E2E: search pipeline (placeholder)', () => {
  test('full flow: BL -> provider -> normalize -> cache -> supabase -> api response', async () => {
    // TODO: implement with supertest + nock + ioredis-mock + supabase mock
  });
});
