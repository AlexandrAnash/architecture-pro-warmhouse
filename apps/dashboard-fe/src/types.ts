// smart_home (Go, :8080) — models/sensor.go
export interface Sensor {
  id: number
  name: string
  type: string
  location: string
  value: number
  unit: string
  status: string
  last_updated: string
  created_at: string
}

export interface SensorCreate {
  name: string
  type: string
  location: string
  unit: string
}

export interface SensorUpdate {
  name: string
  type: string
  location: string
  value: number | null
  unit: string
  status: string
}

// device-manager (Node, :8082) — registryDevices (заполняется из брокера, key sensor.created)
export interface Device {
  id: number
  name: string
  type: string
  location: string
}

// telemetry (Node, :8083) — registryTelemetry (заполняется из брокера, key telemetry.reading)
export interface Telemetry {
  id: number
  device_id: number
  battery: number
  status: string
  created_at: number
}

// temperature-api (Node, :8081) — GET /temperature
export interface TemperatureReading {
  value: number
  unit: string
  timestamp: string
  location: string
  status: string
  sensor_id: string
  sensor_type: string
  description: string
}

export type Health = 'up' | 'down' | 'unknown'
