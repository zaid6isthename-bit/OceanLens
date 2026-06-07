import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL || ''
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || ''

export const supabase = createClient(url, key)

export async function storeShipment(record: { bl: string; provider?: string; data: any }) {
  try {
    const { data, error } = await supabase.from('shipments').insert([{ bl: record.bl, provider: record.provider || 'unknown', payload: record.data }])
    if (error) {
      console.warn('Supabase insert error', error.message)
      return null
    }
    return data
  } catch (err) {
    console.warn('Supabase error', err)
    return null
  }
}
