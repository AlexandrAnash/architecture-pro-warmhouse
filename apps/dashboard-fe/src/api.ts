import type {
  Device,
  Sensor,
  SensorCreate,
  SensorUpdate,
  Telemetry,
  TemperatureReading,
} from './types'

// Единая точка входа — API Gateway (nginx, :8000). Маршрутизация и CORS — на его стороне.
const GATEWAY = 'http://localhost:8000'

const SVC = {
  smarthome: `${GATEWAY}/svc/smarthome`,
  temperature: `${GATEWAY}/svc/temperature`,
  devices: `${GATEWAY}/svc/device-manager`,
  telemetry: `${GATEWAY}/svc/telemetry`,
} as const

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
    ...init,
  })
  const text = await res.text()
  if (!res.ok) {
    let msg = text
    try {
      msg = JSON.parse(text).error ?? text
    } catch {
      /* оставляем как есть */
    }
    throw new Error(`${res.status} ${res.statusText}: ${msg}`)
  }
  return (text ? JSON.parse(text) : null) as T
}

// ---- smart_home: сенсоры (CRUD из postman-коллекции) ----
// Go сериализует пустой nil-слайс как `null`, а не `[]` — приводим к массиву.
export const getSensors = async () =>
  (await request<Sensor[] | null>(`${SVC.smarthome}/api/v1/sensors`)) ?? []

export const getSensor = (id: number) =>
  request<Sensor>(`${SVC.smarthome}/api/v1/sensors/${id}`)

export const createSensor = (body: SensorCreate) =>
  request<Sensor>(`${SVC.smarthome}/api/v1/sensors`, {
    method: 'POST',
    body: JSON.stringify(body),
  })

export const updateSensor = (id: number, body: SensorUpdate) =>
  request<Sensor>(`${SVC.smarthome}/api/v1/sensors/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })

export const deleteSensor = (id: number) =>
  request<{ message: string }>(`${SVC.smarthome}/api/v1/sensors/${id}`, {
    method: 'DELETE',
  })

export const patchSensorValue = (id: number, body: { value: number; status: string }) =>
  request<{ message: string }>(`${SVC.smarthome}/api/v1/sensors/${id}/value`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })

// GET /api/v1/sensors/temperature/:location (новая ручка smart_home → temperature-api)
export const getTemperatureByLocation = (location: string) =>
  request<{ location: string; temperature: TemperatureReading }>(
    `${SVC.smarthome}/api/v1/sensors/temperature/${encodeURIComponent(location)}`,
  )

// ---- temperature-api напрямую ----
export const getTemperatureDirect = (location: string) =>
  request<TemperatureReading>(
    `${SVC.temperature}/temperature?location=${encodeURIComponent(location)}`,
  )

export const getTemperatureBySensor = (sensorID: string) =>
  request<TemperatureReading>(
    `${SVC.temperature}/temperature/${encodeURIComponent(sensorID)}`,
  )

// ---- device-manager ----
export const getDevices = async () =>
  (await request<Device[] | null>(`${SVC.devices}/devices`)) ?? []

// ---- telemetry ----
export const getTelemetry = async () =>
  (await request<Telemetry[] | null>(`${SVC.telemetry}/telemetry`)) ?? []

// ---- health-пробы ----
// у temperature-api нет /health, поэтому пробуем реальный GET /temperature/1
export const HEALTH_PROBES: { name: string; url: string }[] = [
  { name: 'smart_home', url: `${SVC.smarthome}/health` },
  { name: 'temperature-api', url: `${SVC.temperature}/temperature/1` },
  { name: 'device-manager', url: `${SVC.devices}/health` },
  { name: 'telemetry', url: `${SVC.telemetry}/health` },
]

export async function probe(url: string): Promise<boolean> {
  try {
    const res = await fetch(url)
    return res.ok
  } catch {
    return false
  }
}
