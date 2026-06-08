import { NextApiRequest, NextApiResponse } from 'next'
import { enqueueSync } from '../../../lib/worker'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const auth = req.headers.authorization
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) return res.status(401).json({ error: 'Unauthorized' })

  const { bl } = req.body
  await enqueueSync(bl)
  res.json({ ok: true })
}
