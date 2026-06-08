const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Seeding test data...')

  // Create a test user
  const user = await prisma.user.upsert({ where: { email: 'test@example.com' }, update: {}, create: { email: 'test@example.com', name: 'Test User', password: 'test' } })

  // Add API credentials
  await prisma.apiCredential.upsert({ where: { id: 'ceva-cred' }, update: {}, create: { id: 'ceva-cred', userId: user.id, provider: 'CEVA', apiKey: 'CEVA_KEY', endpoint: 'https://ceva.test/api', encrypted: false } })
  await prisma.apiCredential.upsert({ where: { id: 'dsv-cred' }, update: {}, create: { id: 'dsv-cred', userId: user.id, provider: 'DSV', apiKey: 'DSV_KEY', endpoint: 'https://dsv.test/api', encrypted: false } })
  await prisma.apiCredential.upsert({ where: { id: 'mt-cred' }, update: {}, create: { id: 'mt-cred', userId: user.id, provider: 'MarineTraffic', apiKey: 'MT_KEY', endpoint: process.env.MARINETRAFFIC_ENDPOINT || 'https://marinetraffic.test/api', encrypted: false } })
  await prisma.apiCredential.upsert({ where: { id: 'vf-cred' }, update: {}, create: { id: 'vf-cred', userId: user.id, provider: 'VesselFinder', apiKey: 'VF_KEY', endpoint: process.env.VESSELFINDER_ENDPOINT || 'https://vesselfinder.test/api', encrypted: false } })

  // Seed sample searches
  await prisma.search.create({ data: { blNumber: 'CEVA-BL-001', userId: user.id, status: 'Loaded', result: { blNumber: 'CEVA-BL-001', status: 'Loaded', raw: { provider: 'CEVA' } } } })
  await prisma.search.create({ data: { blNumber: 'DSV-BL-001', userId: user.id, status: 'In Transit', result: { blNumber: 'DSV-BL-001', status: 'In Transit', raw: { provider: 'DSV' } } } })

  // Seed vessel positions
  await prisma.vesselPosition.create({ data: { imo: '1234567', name: 'MSC EXEMPLAR', latitude: 22.5, longitude: 14.3, speed: 12.3, heading: 90, destination: 'POD', provider: 'MarineTraffic' } })
  await prisma.vesselPosition.create({ data: { imo: '7654321', name: 'DSV VESSEL', latitude: 23.5, longitude: 15.3, speed: 10.1, heading: 45, destination: 'POL', provider: 'VesselFinder' } })

  console.log('Seeding complete')
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
