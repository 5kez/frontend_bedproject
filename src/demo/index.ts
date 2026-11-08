/* eslint-disable @typescript-eslint/no-base-to-string -- demo rows are untyped DB records (Record<string, unknown>) holding scalars */
// Entry point of the in-browser demo. Loaded only when the app is built with
// VITE_DEMO=true (see src/boot/axios.ts), so none of this ships in the normal
// build. It swaps the axios transport for ./server.ts and the Socket.IO client
// for a fake socket fed by ./realtime.ts.
import {
  AxiosError,
  AxiosHeaders,
  type AxiosAdapter,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios'
import type { Socket } from 'socket.io-client'
import { resetDatabase } from './db'
import { handle } from './server'
import { onRealtime, resetRealtime, startRealtime, vitalsSnapshot } from './realtime'
import { setSocketFactory } from 'src/services/realtimeClient'

const MAX_IMAGE = 320 // px - uploads are downscaled so they fit in localStorage

function readImage(file: Blob): Promise<string> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, MAX_IMAGE / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(img.width * scale))
      canvas.height = Math.max(1, Math.round(img.height * scale))
      canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.82))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve('')
    }
    img.src = url
  })
}

async function parseBody(
  data: unknown,
): Promise<{ body: Record<string, unknown>; files: Record<string, string> }> {
  const files: Record<string, string> = {}
  if (typeof FormData !== 'undefined' && data instanceof FormData) {
    const body: Record<string, unknown> = {}
    for (const [key, value] of data.entries()) {
      if (typeof value === 'string') body[key] = value
      else files[key] = await readImage(value)
    }
    return { body, files }
  }
  if (typeof data === 'string' && data) {
    try {
      return { body: JSON.parse(data) as Record<string, unknown>, files }
    } catch {
      return { body: {}, files }
    }
  }
  return { body: (data as Record<string, unknown>) ?? {}, files }
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

export const demoAdapter: AxiosAdapter = async (config: InternalAxiosRequestConfig) => {
  const raw = config.url ?? ''
  const full =
    /^https?:\/\//.test(raw) || !config.baseURL
      ? raw
      : `${config.baseURL.replace(/\/$/, '')}/${raw.replace(/^\//, '')}`
  const url = new URL(full, 'http://demo.invalid')
  const query = new URLSearchParams(url.search)
  for (const [k, v] of Object.entries((config.params as Record<string, unknown>) ?? {})) {
    if (v !== undefined && v !== null) query.set(k, String(v))
  }
  const { body, files } = await parseBody(config.data)
  await delay(60 + Math.random() * 120) // feel like a network round trip
  const method = (config.method ?? 'get').toUpperCase()
  const res = handle({ method, path: url.pathname, query, body, files })
  // request log for debugging / automated click-through tests
  const log = ((globalThis as Record<string, unknown>).__demoLog ??= []) as unknown[]
  log.push({ method, path: url.pathname + url.search, status: res.status })
  if (log.length > 500) log.splice(0, log.length - 500)
  const response = {
    // JSON round trip: same types the real API delivers, and pages can never
    // mutate the demo database through a response object
    data: res.data === '' || res.data === undefined ? '' : JSON.parse(JSON.stringify(res.data)),
    status: res.status,
    statusText: String(res.status),
    headers: new AxiosHeaders({ 'content-type': 'application/json', 'x-demo': 'true' }),
    config,
    request: { demo: true },
  }
  const validate = config.validateStatus ?? ((s: number) => s >= 200 && s < 300)
  if (!validate(res.status)) {
    throw new AxiosError(
      `Request failed with status code ${res.status}`,
      res.status >= 500 ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_BAD_REQUEST,
      config,
      response.request,
      response,
    )
  }
  return response
}

/** Minimal Socket.IO client look-alike backed by the in-browser realtime engine. */
function createDemoSocket(): Socket {
  const handlers = new Map<string, Set<(...args: unknown[]) => void>>()
  const fire = (event: string, payload?: unknown) => handlers.get(event)?.forEach((h) => h(payload))
  let off: (() => void) | null = null
  const socket = {
    connected: false,
    id: `demo-${Math.random().toString(36).slice(2, 8)}`,
    on(event: string, cb: (...args: unknown[]) => void) {
      if (!handlers.has(event)) handlers.set(event, new Set())
      handlers.get(event)!.add(cb)
      return socket
    },
    off(event: string, cb?: (...args: unknown[]) => void) {
      if (cb) handlers.get(event)?.delete(cb)
      else handlers.delete(event)
      return socket
    },
    emit(event: string) {
      if (event === 'requestPatientVitals')
        setTimeout(() => fire('patientVitalsUpdate', vitalsSnapshot()), 50)
      return socket
    },
    disconnect() {
      off?.()
      off = null
      socket.connected = false
      fire('disconnect')
      return socket
    },
  }
  setTimeout(() => {
    socket.connected = true
    off = onRealtime((event, payload) => fire(event, payload))
    fire('connect')
  }, 150)
  return socket as unknown as Socket
}

export function resetDemo(): void {
  resetDatabase()
  resetRealtime()
}

export function installDemo(api: AxiosInstance): void {
  api.defaults.adapter = demoAdapter
  setSocketFactory(createDemoSocket)
  startRealtime()
}
