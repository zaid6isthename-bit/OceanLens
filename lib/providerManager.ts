import { supabase } from './supabase'
import redis from './redis'

type ProviderState = {
  failures: number
  success: number
  totalResponseTime: number
  lastFailureAt?: number
  circuitOpenUntil?: number
}

const states: Record<string, ProviderState> = {}

function now() { return Date.now() }

function getState(name: string) {
  if (!states[name]) states[name] = { failures: 0, success: 0, totalResponseTime: 0 }
  return states[name]
}

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)) }

export async function callProvider(name: string, fn: () => Promise<any>, opts?: { timeoutMs?: number }) {
  const state = getState(name)

  // Circuit breaker: if open, reject immediately
  if (state.circuitOpenUntil && now() < state.circuitOpenUntil) {
    await logProviderEvent(name, 'circuit_open', { until: state.circuitOpenUntil })
    const cached = await tryReturnCachedFallback(name)
    return { error: 'provider_temporarily_unavailable', _cached: !!cached, result: cached }
  }

  const maxAttempts = 3
  let attempt = 0
  let backoff = 500

  while (attempt < maxAttempts) {
    attempt++
    const start = now()
    try {
      // enforce timeout
      const p = fn()
      const res = opts?.timeoutMs ? await promiseTimeout(p, opts.timeoutMs) : await p
      const rt = now() - start
      state.success += 1
      state.totalResponseTime += rt
      await logProviderRequest(name, { success: true, attempt, responseTime: rt })
      await updateProviderMetrics(name, true, rt)
      return { result: res }
    } catch (err: any) {
      const rt = now() - start
      state.failures += 1
      await logProviderRequest(name, { success: false, attempt, responseTime: rt, error: String(err?.message || err) })
      await logProviderFailure(name, err)
      await updateProviderMetrics(name, false, rt)

      // classify error
      const status = err?.status || err?.code || ''
      // if 429 and Retry-After header provided
      let retryAfterMs = 0
      if (err?.headers && err.headers.get) {
        const ra = err.headers.get('retry-after')
        if (ra) retryAfterMs = Number(ra) * 1000
      }

      if (status === 429) {
        // respect retry after or exponential backoff
        const wait = retryAfterMs || backoff * attempt
        await sleep(wait)
      } else if (String(status).startsWith('5') || err?.code === 'ETIMEDOUT') {
        // transient server errors, backoff and retry
        await sleep(backoff * attempt)
      } else {
        // client error, do not retry
        // open circuit if many failures
        if (state.failures >= 5) {
          state.circuitOpenUntil = now() + 1000 * 60 * 5 // 5min cooldown
          await logProviderEvent(name, 'circuit_opened', { until: state.circuitOpenUntil })
        }
        return { error: 'provider_error', reason: String(err?.message || err) }
      }

      // last attempt, open circuit if repeating failures
      if (attempt >= maxAttempts) {
        state.circuitOpenUntil = now() + 1000 * 60 * 2 // 2min cooldown on repeated failures
        await logProviderEvent(name, 'circuit_opened', { until: state.circuitOpenUntil })
        const cached = await tryReturnCachedFallback(name)
        return { error: 'provider_failed', _cached: !!cached, result: cached }
      }
    }
  }
}

async function promiseTimeout<T>(p: Promise<T>, ms: number) {
  let timer: any
  const timeout = new Promise((_r, rej) => { timer = setTimeout(() => rej(new Error('timeout')), ms) })
  try {
    return await Promise.race([p, timeout]) as T
  } finally { clearTimeout(timer) }
}

async function tryReturnCachedFallback(providerName: string) {
  try {
    const key = `provider:last_success:${providerName}`
    const v = await redis.get(key)
    if (v) return JSON.parse(v)
  } catch (e) {}
  return null
}

async function logProviderRequest(provider: string, details: any) {
  try {
    await supabase.from('provider_request_logs').insert([{ provider, timestamp: new Date().toISOString(), details }])
  } catch (e) {}
}

async function logProviderFailure(provider: string, err: any) {
  try {
    await supabase.from('provider_failures').insert([{ provider, timestamp: new Date().toISOString(), error: String(err?.message || err) }])
  } catch (e) {}
}

async function logProviderEvent(provider: string, event: string, meta?: any) {
  try {
    await supabase.from('provider_metrics').insert([{ provider, timestamp: new Date().toISOString(), event, meta }])
  } catch (e) {}
}

async function updateProviderMetrics(provider: string, success: boolean, responseTime: number) {
  try {
    // upsert into provider_health
    const { data } = await supabase.from('provider_health').select('*').eq('provider', provider)
    if (data && data.length > 0) {
      await supabase.from('provider_health').update({ last_checked: new Date().toISOString(), avg_response_time: responseTime }).eq('provider', provider)
    } else {
      await supabase.from('provider_health').insert([{ provider, last_checked: new Date().toISOString(), avg_response_time: responseTime, available: success }])
    }
  } catch (e) {}
}

export function markProviderSuccess(providerName: string, payload: any) {
  // store last successful result in redis for fallback
  try {
    const key = `provider:last_success:${providerName}`
    redis.set(key, JSON.stringify(payload), 'EX', 60 * 60) // 1 hour
  } catch (e) {}
}

// helper for tests to inspect circuit
export function isCircuitOpen(name: string) {
  const s: any = (states as any)[name]
  if (!s) return false
  return !!(s.circuitOpenUntil && Date.now() < s.circuitOpenUntil)
}
