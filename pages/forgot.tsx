import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // In production, send password reset email via your email provider
    setSent(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-md p-8 border rounded-md shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Forgot Password</h2>
        {sent ? (
          <div>
            <p className="text-sm text-gray-600 mb-4">If an account with that email exists, a password reset link has been sent.</p>
            <Link href="/login" className="text-indigo-600 text-sm">Back to Login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label className="block text-sm">Email</label>
            <input className="w-full p-2 mb-4 border rounded" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <button className="w-full bg-indigo-600 text-white p-2 rounded" type="submit">Send Reset Link</button>
            <div className="mt-4 text-sm">
              <Link href="/login" className="text-indigo-600">Back to Login</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
