import React, { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

export default function MapView({ bl, data }: { bl: string; data: any }) {
  const ref = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)

  useEffect(() => {
    if (!ref.current) return
    if (mapRef.current) return

    const map = new mapboxgl.Map({
      container: ref.current,
      style: 'mapbox://styles/mapbox/light-v10',
      center: [0, 20],
      zoom: 2
    })

    mapRef.current = map
    return () => map.remove()
  }, [])

  useEffect(() => {
    if (!data || !mapRef.current) return
    // place vessel marker if coordinates present
    const coords = data?.vessel?.coordinates
    if (coords && mapRef.current) {
      const el = document.createElement('div')
      el.style.width = '28px'
      el.style.height = '28px'
      el.style.background = 'rgba(30,64,175,0.9)'
      el.style.borderRadius = '50%'

      new mapboxgl.Marker(el).setLngLat([coords.lng, coords.lat]).addTo(mapRef.current)
      mapRef.current.flyTo({ center: [coords.lng, coords.lat], zoom: 6 })
    }
  }, [data])

  return <div ref={ref} className="w-full h-full" />
}
