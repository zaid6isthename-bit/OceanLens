import { ForwarderProvider, NormalizedShipment } from '../provider'

const KuehneProvider: ForwarderProvider = {
  async fetchByBL(_bl: string, _userId?: string) {
    // Placeholder for Kuehne + Nagel integration
    return null
  }
}

export default KuehneProvider
