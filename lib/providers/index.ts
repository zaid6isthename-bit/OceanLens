import CEVAProvider from './ceva'
import DSVProvider from './dsv'
import DHLProvider from './dhl'
import KuehneProvider from './kuehne'
import DBSchenkerProvider from './dbschenker'
import { prisma } from '../../lib/prisma'
import { callProvider, markProviderSuccess } from '../providerManager'

const providers = [
  { name: 'CEVA', impl: CEVAProvider },
  { name: 'DSV', impl: DSVProvider },
  { name: 'DHL', impl: DHLProvider },
  { name: 'Kuehne', impl: KuehneProvider },
  { name: 'DBSchenker', impl: DBSchenkerProvider }
]

export async function fetchFromForwarders(bl: string, userId?: string) {
  try {
    // order providers by user-configured credentials first
    let ordered = [...providers]
    if (userId) {
      const creds = await prisma.apiCredential.findMany({ where: { userId } })
      const names = creds.map((c) => c.provider.toLowerCase())
      ordered.sort((a, b) => {
        const aIdx = names.findIndex((n) => a.name.toLowerCase().includes(n) || n.includes(a.name.toLowerCase()))
        const bIdx = names.findIndex((n) => b.name.toLowerCase().includes(n) || n.includes(b.name.toLowerCase()))
        return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx)
      })
    }

    for (const p of ordered) {
      try {
        const r = await callProvider(p.name, () => p.impl.fetchByBL(bl, userId), { timeoutMs: 8000 })
        if (r && r.result) {
          // mark last success for fallback
          markProviderSuccess(p.name, r.result)
          return { provider: p.name, result: r.result }
        }
        // if cached result returned by callProvider
        if (r && r._cached && r.result) return { provider: p.name, result: r.result, _cached: true }
      } catch (err) {
        continue
      }
    }
  } catch (err) {
    // swallow
  }
  return null
}

export default providers
