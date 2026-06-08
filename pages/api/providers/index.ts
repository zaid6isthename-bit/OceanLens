import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { encrypt } from '../../../lib/crypto'
import { getEncryptionKey } from '../../../lib/encryption'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session?.user?.email) return res.status(401).json({ error: 'Not authenticated' })

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return res.status(401).json({ error: 'User not found' })
  const userId = user.id

  if (req.method === 'GET') {
    const apis = await prisma.apiCredential.findMany({ where: { userId } })
    res.json(apis.map((a) => ({ id: a.id, provider: a.provider, endpoint: a.endpoint, lastSync: a.lastSync, encrypted: a.encrypted })))
    return
  }

  if (req.method === 'POST') {
    const { provider, apiKey, secretKey, endpoint } = req.body
    const key = getEncryptionKey()
    const encKey = encrypt(apiKey, key)
    const encSecret = secretKey ? encrypt(secretKey, key) : undefined
    const created = await prisma.apiCredential.create({ data: { userId, provider, apiKey: encKey, secretKey: encSecret, endpoint, encrypted: true } })
    res.json({ id: created.id })
    return
  }

  res.setHeader('Allow', 'GET,POST')
  res.status(405).end('Method Not Allowed')
}
