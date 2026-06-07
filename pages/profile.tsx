import { useEffect, useState } from 'react'

export default function Profile() {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // minimal: fetch session info from NextAuth endpoint
    fetch('/api/auth/session').then((r) => r.json()).then(setUser).catch(() => {})
  }, [])

  return (
    <div className="min-h-screen p-8 bg-white">
      <h1 className="text-2xl font-semibold mb-4">Profile</h1>
      <div className="p-4 border rounded w-full max-w-lg">
        <div className="mb-2">Name: {user?.user?.name || '-'}</div>
        <div className="mb-2">Email: {user?.user?.email || '-'}</div>
        <div className="mb-2">Company: -</div>
        <div className="mt-4">
          <a className="text-indigo-600" href="/wizard">Manage API Connections</a>
        </div>
      </div>
    </div>
  )
}
