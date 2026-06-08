import Link from 'next/link'

export default function ServerError() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2">500</h1>
        <p className="text-gray-500 mb-4">Something went wrong</p>
        <Link href="/" className="text-indigo-600">Go Home</Link>
      </div>
    </div>
  )
}
