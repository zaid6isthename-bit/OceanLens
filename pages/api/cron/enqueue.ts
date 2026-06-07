import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { enqueueSync } from '../../../lib/worker'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session?.user?.email) return res.status(401).json({ error: 'Not authenticated' })
  if (req.method !== 'POST') return res.status(405).end()

  const { bl } = req.body
  await enqueueSync(bl)
  res.json({ ok: true })
}
