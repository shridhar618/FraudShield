// api.js — Centralised API client
// All fetch calls go through here so errors are handled consistently.

const API_BASES = [
  import.meta.env.VITE_API_BASE,
  '',                         // Vite dev proxy or Flask-served production build
  'http://127.0.0.1:5001',    // Default Flask API
  'http://localhost:5001',
  'http://127.0.0.1:5000',    // Direct Flask fallback for preview/static frontend
  'http://localhost:5000',
].filter((base, index, arr) => base !== undefined && arr.indexOf(base) === index)

async function tryCall(base, method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  }
  if (body) opts.body = JSON.stringify(body)

  const res = await fetch(base + path, opts)
  const contentType = res.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')

  if (!isJson) {
    const error = new Error(
      'API route returned a web page instead of JSON. Start Flask with: python3 backend/app.py'
    )
    error.retryable = true
    throw error
  }

  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
  return data
}

async function call(method, path, body) {
  let lastError

  for (const base of API_BASES) {
    try {
      return await tryCall(base, method, path, body)
    } catch (err) {
      lastError = err
      const networkOrRouteError =
        err.retryable ||
        err instanceof TypeError ||
        /Failed to fetch|NetworkError|Load failed/i.test(err.message)

      if (!networkOrRouteError) throw err
    }
  }

  throw new Error(
    `${lastError?.message || 'Cannot reach Flask API'}. Make sure Flask is running at http://127.0.0.1:5001`
  )
}

export const api = {
  predict:      (payload)  => call('POST',   '/predict', payload),
  getMetrics:   ()         => call('GET',    '/metrics'),
  getHistory:   ()         => call('GET',    '/history'),
  clearHistory: ()         => call('DELETE', '/history'),
  getOptions:   ()         => call('GET',    '/options'),
  getDemo:      ()         => call('GET',    '/demo'),
  getStats:     ()         => call('GET',    '/stats'),
  getHealth:    ()         => call('GET',    '/health'),
}
