export type MTPosition = { lat: number; lon: number } | null

export async function fetchMarineTrafficPosition(endpoint: string, apiKey?: string, imo?: string): Promise<MTPosition> {
  if (!endpoint) return null
  try {
    const url = new URL(endpoint)
    if (imo && !url.searchParams.has('imo')) url.searchParams.set('imo', imo)
    if (apiKey && !url.searchParams.has('apikey')) url.searchParams.set('apikey', apiKey)

    const res = await fetch(url.toString(), { method: 'GET' })
    if (!res.ok) return null
    const text = await res.text()

    // MarineTraffic sometimes returns CSV-like or JSON. Try JSON parse first.
    let json: any = null
    try { json = JSON.parse(text) } catch (e) { json = null }

    if (json) {
      // common shape: array of objects with LAT, LON or latitude, longitude
      if (Array.isArray(json) && json.length > 0) {
        const first = json[0]
        if (first.LAT && first.LON) return { lat: Number(first.LAT), lon: Number(first.LON) }
        if (first.lat && first.lon) return { lat: Number(first.lat), lon: Number(first.lon) }
        if (first.latitude && first.longitude) return { lat: Number(first.latitude), lon: Number(first.longitude) }
      }
      // object shape
      if (json.LAT && json.LON) return { lat: Number(json.LAT), lon: Number(json.LON) }
    }

    // fallback: try to parse CSV-like: lines with lat,lon
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
    for (const line of lines) {
      const parts = line.split(',').map((p) => p.trim())
      if (parts.length >= 2) {
        const a = Number(parts[0])
        const b = Number(parts[1])
        if (!Number.isNaN(a) && !Number.isNaN(b)) return { lat: a, lon: b }
      }
    }

    return null
  } catch (err) {
    return null
  }
}
