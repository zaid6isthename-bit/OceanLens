import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { useState } from 'react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-md p-8 border rounded-md shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Login</h2>
        <label className="block text-sm">Email</label>
        <input className="w-full p-2 mb-3 border rounded" value={email} onChange={(e) => setEmail(e.target.value)} />
        <label className="block text-sm">Password</label>
        <input type="password" className="w-full p-2 mb-4 border rounded" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="w-full bg-indigo-600 text-white p-2 rounded" onClick={() => signIn('credentials', { email, password })}>
          Login
        </button>

        <div className="mt-4 text-sm flex justify-between">
          <Link href="/signup">Create Account</Link>
          <Link href="/forgot">Forgot Password</Link>
        </div>
      </div>
    </div>
  )
}
