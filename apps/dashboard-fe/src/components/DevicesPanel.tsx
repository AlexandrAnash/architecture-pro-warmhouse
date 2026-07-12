import { useCallback, useEffect, useState } from 'react'
import { getDevices } from '../api'
import type { Device } from '../types'

export default function DevicesPanel() {
  const [devices, setDevices] = useState<Device[]>([])
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      setDevices(await getDevices())
    } catch (e) {
      setError(String(e))
    }
  }, [])

  useEffect(() => {
    load()
    const t = setInterval(load, 5000)
    return () => clearInterval(t)
  }, [load])

  return (
    <section className="card">
      <div className="card-head">
        <h2>Устройства <span className="muted">device-manager · /devices (из брокера, sensor.created)</span></h2>
        <button className="ghost small" onClick={load}>Обновить</button>
      </div>
      {error && <div className="alert err">{error}</div>}
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>id</th><th>name</th><th>type</th><th>location</th></tr>
          </thead>
          <tbody>
            {devices.length === 0 && (
              <tr><td colSpan={4} className="muted center">пусто — создай сенсор, событие sensor.created наполнит реестр</td></tr>
            )}
            {devices.map((d) => (
              <tr key={d.id}>
                <td>{d.id}</td><td>{d.name}</td><td>{d.type}</td><td>{d.location}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
