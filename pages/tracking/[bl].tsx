import { useRouter } from 'next/router'
import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import ShipmentPanel from '../../components/ShipmentPanel'
import Timeline from '../../components/Timeline'

const MapView = dynamic(() => import('../../components/MapView'), { ssr: false })

export default function Tracking() {
  const { status } = useSession()
  const router = useRouter()
  const { bl } = router.query
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    if (!bl) return
    let mounted = true
    async function load() {
      const r = await fetch(`/api/search?bl=${encodeURIComponent(String(bl))}`)
      const d = await r.json()
      if (mounted) setData(d)
    }
    load()

    const interval = setInterval(load, 1000 * 60 * 5)
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [bl])

  if (status === 'loading' || status === 'unauthenticated') return null

  return (
    <div className="h-screen w-screen relative">
      <MapView bl={String(bl || '')} data={data} />

      <div className="absolute top-4 right-4 bg-white rounded p-3 shadow">
        <div className="font-semibold">{bl}</div>
        <div className="text-sm text-gray-600">Status: {data?.status || 'Loading'}</div>
        <div className="text-xs text-gray-400">Last Updated: {data?.lastUpdated || data?._cached ? 'cached' : '...'}</div>
      </div>

      <ShipmentPanel shipment={data} />
      <Timeline events={data?.timeline} />
    </div>
  )
}
