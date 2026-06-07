import { ForwarderProvider, NormalizedShipment } from '../provider'

const DHLProvider: ForwarderProvider = {
  async fetchByBL(_bl: string, _userId?: string) {
    // Placeholder for DHL Global Forwarding integration
    return null
  }
}

export default DHLProvider
