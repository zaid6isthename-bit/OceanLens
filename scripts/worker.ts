import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(__dirname, '..', '.env') })

import '../lib/worker'

console.log('BullMQ worker started, listening for sync jobs')
