// Контракт телеметрии — совпадает с ITelemetry консюмера (apps/telemetry/src/registryTelemetry.ts).
// Консюмер кладёт объект в Map по ключу `id`, поэтому `id` уникален на каждое показание,
// а `device_id` идентифицирует устройство.
export interface Telemetry {
  id: number
  device_id: number
  battery: number
  status: string
  created_at: number
}

export type DeviceStatus = 'active' | 'idle' | 'charging' | 'offline'

export type ConnState = 'disconnected' | 'connecting' | 'connected' | 'error'

export interface LogEntry {
  id: number
  ts: number
  kind: 'tx' | 'sys' | 'err'
  text: string
}
