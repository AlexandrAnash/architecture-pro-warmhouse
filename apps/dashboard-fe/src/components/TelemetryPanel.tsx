import { useCallback, useEffect, useRef, useState } from 'react'
import { getTelemetry } from '../api'
import type { Telemetry } from '../types'

export default function TelemetryPanel() {
  const [rows, setRows] = useState<Telemetry[]>([])
  const [error, setError] = useState('')
  const [auto, setAuto] = useState(true)
  const autoRef = useRef(auto)
  autoRef.current = auto

  const load = useCallback(async () => {
    setError('')
    try {
      setRows(await getTelemetry())
    } catch (e) {
      setError(String(e))
    }
  }, [])

  useEffect(() => {
    load()
    const t = setInterval(() => {
      if (autoRef.current) load()
    }, 2000)
    return () => clearInterval(t)
  }, [load])

  // свежие сверху
  const sorted = [...rows].sort((a, b) => b.id - a.id)

  return (
    <section className="card">
      <div className="card-head">
        <h2>Телеметрия <span className="muted">telemetry · /telemetry (из брокера, telemetry.reading)</span></h2>
        <div className="head-actions">
          <label className="inline">
            <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} />
            авто (2с)
          </label>
          <span className="muted">всего: {rows.length}</span>
          <button className="ghost small" onClick={load}>Обновить</button>
        </div>
      </div>
      {error && <div className="alert err">{error}</div>}
      <div className="table-wrap scroll">
        <table>
          <thead>
            <tr><th>id</th><th>device_id</th><th>battery</th><th>status</th><th>created_at</th></tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr><td colSpan={5} className="muted center">пусто — запусти датчик (sensor-fe), показания появятся здесь</td></tr>
            )}
            {sorted.slice(0, 200).map((r) => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{r.device_id}</td>
                <td>
                  <span className="battery">
                    <span className="battery-fill" style={{ width: `${Math.max(0, Math.min(100, r.battery))}%` }} />
                  </span>
                  {r.battery}%
                </td>
                <td><span className={`badge ${r.status}`}>{r.status}</span></td>
                <td className="muted">{r.created_at ? new Date(r.created_at).toLocaleTimeString() : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
