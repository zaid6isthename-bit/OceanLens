import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'

export default function Profile() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    fetch('/api/auth/session').then((r) => r.json()).then(setUser).catch(() => {})
  }, [])

  if (status === 'loading' || status === 'unauthenticated') return null

  return (
    <div className="min-h-screen p-8 bg-white">
      <h1 className="text-2xl font-semibold mb-4">Profile</h1>
      <div className="p-4 border rounded w-full max-w-lg">
        <div className="mb-2">Name: {user?.user?.name || session?.user?.name || '-'}</div>
        <div className="mb-2">Email: {user?.user?.email || session?.user?.email || '-'}</div>
        <div className="mb-2">Company: -</div>
        <div className="mt-4">
          <a className="text-indigo-600" href="/wizard">Manage API Connections</a>
        </div>
      </div>
    </div>
  )
}
