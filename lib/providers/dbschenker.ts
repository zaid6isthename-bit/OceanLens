import { ForwarderProvider, NormalizedShipment } from '../provider'

const DBSchenkerProvider: ForwarderProvider = {
  async fetchByBL(_bl: string, _userId?: string) {
    // Placeholder for DB Schenker integration
    return null
  }
}

export default DBSchenkerProvider
