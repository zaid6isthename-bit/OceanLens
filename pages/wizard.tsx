import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

const PROVIDERS = ['Forwarders', 'CEVA', 'DSV', 'DHL', 'Kuehne + Nagel']

export default function Wizard() {
  const { data: session } = useSession()
  const [list, setList] = useState<any[]>([])
  const [form, setForm] = useState({ provider: '', apiKey: '', secretKey: '', endpoint: '' })
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    fetch('/api/providers').then((r) => r.json()).then(setList).catch(() => setList([]))
  }, [])

  async function add() {
    await fetch('/api/providers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setForm({ provider: '', apiKey: '', secretKey: '', endpoint: '' })
    const r = await fetch('/api/providers')
    setList(await r.json())
  }

  async function test() {
    setTesting(true)
    const r = await fetch('/api/providers/test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint: form.endpoint, apiKey: form.apiKey, secretKey: form.secretKey }) })
    const j = await r.json()
    alert(JSON.stringify(j))
    setTesting(false)
  }

  return (
    <div className="min-h-screen p-8 bg-white">
      <h1 className="text-2xl font-semibold mb-4">API Setup Wizard</h1>
      <div className="mb-6">
        <label className="block text-sm">Provider</label>
        <select className="border p-2 rounded w-64" value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })}>
          <option value="">Select provider</option>
          {PROVIDERS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>
      <div className="mb-3">
        <input placeholder="API Key" className="border p-2 rounded w-96" value={form.apiKey} onChange={(e) => setForm({ ...form, apiKey: e.target.value })} />
      </div>
      <div className="mb-3">
        <input placeholder="Secret Key" className="border p-2 rounded w-96" value={form.secretKey} onChange={(e) => setForm({ ...form, secretKey: e.target.value })} />
      </div>
      <div className="mb-3">
        <input placeholder="Endpoint URL" className="border p-2 rounded w-96" value={form.endpoint} onChange={(e) => setForm({ ...form, endpoint: e.target.value })} />
      </div>
      <div className="flex gap-3">
        <button className="bg-indigo-600 text-white p-2 rounded" onClick={add}>Save</button>
        <button className="bg-gray-200 p-2 rounded" onClick={test} disabled={testing}>{testing ? 'Testing...' : 'Test Connection'}</button>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-medium mb-2">Connected APIs</h2>
        <ul>
          {list.map((p) => (
            <li key={p.id} className="p-2 border rounded mb-2">{p.provider} — {p.endpoint} — {p.lastSync || 'never'}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
