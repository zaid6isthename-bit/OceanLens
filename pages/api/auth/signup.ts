import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import bcrypt from 'bcrypt'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { name, company, email, phone, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Missing email or password' })

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return res.status(409).json({ error: 'User exists' })

  const hash = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({ data: { name, companyName: company, email, phone, password: hash } })
  res.status(201).json({ id: user.id, email: user.email })
}
