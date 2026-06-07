import { NextApiRequest, NextApiResponse } from 'next'
import fetch from 'node-fetch'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session?.user?.email) return res.status(401).json({ error: 'Not authenticated' })

  if (req.method !== 'POST') return res.status(405).end()
  const { endpoint, apiKey, secretKey } = req.body
  if (!endpoint) return res.status(400).json({ error: 'Missing endpoint' })

  try {
    const headers: any = {}
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`

    const r = await fetch(endpoint, { method: 'GET', headers, timeout: 5000 as any })
    if (!r.ok) return res.status(400).json({ ok: false, status: r.status })
    res.json({ ok: true })
  } catch (err: any) {
    res.status(500).json({ ok: false, error: String(err.message || err) })
  }
}
