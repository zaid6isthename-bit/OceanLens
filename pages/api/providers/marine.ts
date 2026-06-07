import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '../../../lib/prisma'
import { decrypt } from '../../../lib/crypto'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session?.user?.email) return res.status(401).json({ error: 'Not authenticated' })

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return res.status(401).json({ error: 'User not found' })

  const imo = String(req.query.imo || req.body.imo || '')
  if (!imo) return res.status(400).json({ error: 'Missing imo' })

  // find MarineTraffic credential
  const cred = await prisma.apiCredential.findFirst({ where: { userId: user.id, provider: { contains: 'MarineTraffic' } } })
  if (!cred) return res.status(404).json({ error: 'MarineTraffic credential not configured' })

  const secret = process.env.NEXTAUTH_SECRET || 'dev-secret'
  let apiKey = String(cred.apiKey || '')
  try { apiKey = decrypt(apiKey, secret) } catch (e) { /* assume plain */ }

  const endpoint = cred.endpoint || ''
  if (!endpoint) return res.status(400).json({ error: 'Credential has no endpoint configured' })

  try {
    const url = new URL(endpoint)
    if (!url.searchParams.has('imo')) url.searchParams.set('imo', imo)
    if (apiKey && !url.searchParams.has('apikey') && !url.searchParams.has('key') && !url.searchParams.has('token')) url.searchParams.set('apikey', apiKey)

    const r = await fetch(url.toString())
    if (!r.ok) return res.status(502).json({ error: 'Upstream error', status: r.status })
    const json = await r.json().catch(() => null)
    if (!json) return res.status(502).json({ error: 'Invalid JSON from provider' })

    // try to parse coordinates
    if (json.lat && json.lon) return res.json({ lat: Number(json.lat), lon: Number(json.lon), raw: json })
    if (json.latitude && json.longitude) return res.json({ lat: Number(json.latitude), lon: Number(json.longitude), raw: json })
    // fallback: return raw
    return res.json({ raw: json })
  } catch (err: any) {
    return res.status(500).json({ error: String(err.message || err) })
  }
}
