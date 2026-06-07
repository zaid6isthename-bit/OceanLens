import React from 'react'
import { NormalizedShipment } from '../lib/provider'

export default function ShipmentPanel({ shipment }: { shipment: NormalizedShipment | null }) {
  if (!shipment) return null

  return (
    <div className="glass-panel absolute left-6 top-16 w-96 p-4 rounded-lg bg-white/60 backdrop-blur border border-white/20 shadow-md">
      <h3 className="font-semibold mb-2">Shipment</h3>
      <div className="text-sm mb-1"><strong>BL:</strong> {shipment.blNumber}</div>
      <div className="text-sm mb-1"><strong>Status:</strong> {shipment.status || 'Unknown'}</div>
      <div className="text-sm mb-1"><strong>Vessel:</strong> {shipment.vessel?.name || '-'}</div>
      <div className="text-sm mb-1"><strong>IMO:</strong> {shipment.vessel?.imo || '-'}</div>
      <div className="text-sm mb-1"><strong>Voyage:</strong> {shipment.vessel?.voyage || '-'}</div>
      <div className="mt-2">
        <strong>Route</strong>
        <div className="text-sm">POL: {shipment.pol || '-'}</div>
        <div className="text-sm">POD: {shipment.pod || '-'}</div>
      </div>
      <div className="mt-2">
        <strong>Containers</strong>
        <div className="text-sm">{shipment.containers?.join(', ') || '-'}</div>
      </div>
    </div>
  )
}
