import React from 'react'
import { TimelineEvent } from '../lib/provider'

export default function Timeline({ events }: { events?: TimelineEvent[] }) {
  if (!events || events.length === 0) return <div className="absolute left-6 bottom-16 w-96 p-4 text-sm text-gray-500">No timeline available</div>

  return (
    <div className="absolute left-6 bottom-16 w-96 p-4 rounded-lg bg-white/60 backdrop-blur border border-white/20 shadow-md">
      <h4 className="font-semibold mb-2">Timeline</h4>
      <ol className="text-sm space-y-2 max-h-56 overflow-auto">
        {events.map((ev, i) => (
          <li key={i} className="">
            <div className="text-xs text-gray-500">{ev.time || ''}</div>
            <div>{ev.event}</div>
          </li>
        ))}
      </ol>
    </div>
  )
}
