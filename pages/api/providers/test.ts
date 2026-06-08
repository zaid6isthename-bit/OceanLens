import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session?.user?.email) return res.status(401).json({ error: 'Not authenticated' })

  if (req.method !== 'POST') return res.status(405).end()
  const { endpoint, apiKey } = req.body
  if (!endpoint) return res.status(400).json({ error: 'Missing endpoint' })

  try {
    const headers: Record<string, string> = {}
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    const r = await fetch(endpoint, { method: 'GET', headers, signal: controller.signal })
    clearTimeout(timeout)
    if (!r.ok) return res.status(400).json({ ok: false, status: r.status })
    res.json({ ok: true })
  } catch (err: any) {
    res.status(500).json({ ok: false, error: String(err.message || err) })
  }
}
