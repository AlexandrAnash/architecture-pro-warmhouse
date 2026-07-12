import { useState } from 'react'
import { getTemperatureByLocation, getTemperatureBySensor, getTemperatureDirect } from '../api'
import type { TemperatureReading } from '../types'

type Mode = 'location' | 'sensor' | 'smarthome'
type Origin = 'micro' | 'mono'

const MODES: { key: Mode; label: string; hint: string; origin: Origin }[] = [
  { key: 'location', label: 'по локации', hint: 'temperature-api · GET /temperature?location=', origin: 'micro' },
  { key: 'sensor', label: 'по sensorID', hint: 'temperature-api · GET /temperature/:sensorID', origin: 'micro' },
  { key: 'smarthome', label: 'через smart_home', hint: 'smart_home · GET /api/v1/sensors/temperature/:location', origin: 'mono' },
]

export default function TemperaturePanel() {
  const [mode, setMode] = useState<Mode>('location')
  const [query, setQuery] = useState('Living Room')
  const [result, setResult] = useState<TemperatureReading | null>(null)
  const [error, setError] = useState('')

  const fetchIt = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setResult(null)
    try {
      if (mode === 'location') setResult(await getTemperatureDirect(query))
      else if (mode === 'sensor') setResult(await getTemperatureBySensor(query))
      else {
        const r = await getTemperatureByLocation(query)
        setResult(r.temperature ?? (r as unknown as TemperatureReading))
      }
    } catch (e) {
      setError(String(e))
    }
  }

  const active = MODES.find((m) => m.key === mode)!

  return (
    <section className="card">
      <div className="card-head">
        <h2>Температура <span className="muted">temperature-api</span></h2>
      </div>

      <div className="tabs">
        {MODES.map((m) => (
          <button
            key={m.key}
            className={`tab ${mode === m.key ? 'on' : ''}`}
            onClick={() => { setMode(m.key); setResult(null); setError('') }}
          >
            {m.label}
            <span className={`origin-badge ${m.origin}`}>{m.origin === 'mono' ? 'монолит' : 'µ-сервис'}</span>
          </button>
        ))}
      </div>
      <div className="muted small-hint">{active.hint}</div>

      <form className="row-inline" onSubmit={fetchIt}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={mode === 'sensor' ? 'sensorID (1, 2, 3…)' : 'location (Living Room…)'}
        />
        <button type="submit">Запросить</button>
      </form>

      {error && <div className="alert err">{error}</div>}
      {result && (
        <div className="reading">
          <div className="reading-big">
            {result.value}
            <span className="unit">{result.unit}</span>
          </div>
          <div className="reading-meta">
            <div><span className="muted">location</span> {result.location}</div>
            <div><span className="muted">sensor_id</span> {result.sensor_id}</div>
            <div><span className="muted">status</span> <span className={`badge ${result.status}`}>{result.status}</span></div>
            <div><span className="muted">time</span> {new Date(result.timestamp).toLocaleString()}</div>
            <div className="wide"><span className="muted">описание</span> {result.description}</div>
          </div>
        </div>
      )}
    </section>
  )
}
