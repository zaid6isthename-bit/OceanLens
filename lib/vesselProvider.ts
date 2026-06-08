export type VesselCoords = { lat: number; lng: number }

export type NormalizedVesselInfo = {
  imo?: string
  name?: string
  coordinates?: VesselCoords
  speed?: number | null
  heading?: number | null
  destination?: string | null
  eta?: string | null
  provider?: string
}

export interface IVesselTrackingProvider {
  getVesselByIMO(imo: string, userId?: string): Promise<NormalizedVesselInfo | null>
  getVesselByName(name: string, userId?: string): Promise<NormalizedVesselInfo | null>
  getCurrentPosition(imo: string, userId?: string): Promise<NormalizedVesselInfo | null>
  getVoyageInformation(imo: string, userId?: string): Promise<NormalizedVesselInfo | null>
}
