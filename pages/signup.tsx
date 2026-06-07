import { useState } from 'react'
import { useRouter } from 'next/router'

export default function Signup() {
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const router = useRouter()

  async function onSubmit(e: any) {
    e.preventDefault()
    await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, company, email, phone, password })
    })
    router.push('/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <form className="w-full max-w-md p-8 border rounded-md shadow-sm" onSubmit={onSubmit}>
        <h2 className="text-xl font-semibold mb-4">Create Account</h2>
        <input className="w-full p-2 mb-2 border rounded" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="w-full p-2 mb-2 border rounded" placeholder="Company Name" value={company} onChange={(e) => setCompany(e.target.value)} />
        <input className="w-full p-2 mb-2 border rounded" placeholder="Company Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="w-full p-2 mb-2 border rounded" placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <input type="password" className="w-full p-2 mb-2 border rounded" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <input type="password" className="w-full p-2 mb-4 border rounded" placeholder="Confirm Password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        <button className="w-full bg-indigo-600 text-white p-2 rounded">Create Account</button>
      </form>
    </div>
  )
}
