import { useRouter } from 'next/router'
import { useState } from 'react'
import Head from 'next/head'
import dynamic from 'next/dynamic'

const SearchBox = dynamic(() => import('../components/SearchBox'))

export default function Home() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [animatingBl, setAnimatingBl] = useState<string | null>(null)
  const [pinned, setPinned] = useState(false)

  const onSearch = (bl: string) => {
    if (!bl) return
    setAnimatingBl(bl)
    setPinned(false)
    // play animation for 700ms then navigate
    setTimeout(() => {
      setPinned(true)
      // small delay to let pinned settle then navigate
      setTimeout(() => router.push(`/tracking/${encodeURIComponent(bl)}`), 120)
    }, 750)
  }

  return (
    <div className="h-screen bg-white flex items-center justify-center">
      <Head>
        <title>OceanLens — Enter BL Number</title>
      </Head>

      <main className="w-full max-w-2xl px-6 relative">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold">OceanLens</h1>
          <p className="text-sm text-gray-500 mt-2">Enter a Bill of Lading to start tracking</p>
        </div>

        <SearchBox
          placeholder="Enter BL Number"
          value={query}
          onChange={setQuery}
          onSubmit={() => onSearch(query)}
        />

        {animatingBl && (
          <div
            className={`bl-pill ${pinned ? 'pinned' : 'animate-pin'}`}
            onAnimationEnd={() => setPinned(true)}
            style={{ pointerEvents: 'none' }}
          >
            {animatingBl}
          </div>
        )}
      </main>
    </div>
  )
}

