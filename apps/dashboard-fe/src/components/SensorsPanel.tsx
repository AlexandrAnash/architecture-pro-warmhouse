import { useCallback, useEffect, useState } from 'react'
import {
  createSensor,
  deleteSensor,
  getSensor,
  getSensors,
  patchSensorValue,
  updateSensor,
} from '../api'
import type { Sensor } from '../types'

const EMPTY_FORM = { name: '', type: 'temperature', location: '', unit: '°C' }

export default function SensorsPanel() {
  const [sensors, setSensors] = useState<Sensor[]>([])
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [detail, setDetail] = useState<Sensor | null>(null)

  // форма create/update
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')
  const [editStatus, setEditStatus] = useState('active')

  // patch value
  const [patchId, setPatchId] = useState('')
  const [patchValue, setPatchValue] = useState('')
  const [patchStatus, setPatchStatus] = useState('active')

  const load = useCallback(async () => {
    setError('')
    try {
      setSensors(await getSensors())
    } catch (e) {
      setError(String(e))
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const flash = (m: string) => {
    setMsg(m)
    setTimeout(() => setMsg(''), 4000)
  }

  const resetForm = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setEditValue('')
    setEditStatus('active')
  }

  const startEdit = (s: Sensor) => {
    setEditingId(s.id)
    setForm({ name: s.name, type: s.type, location: s.location, unit: s.unit })
    setEditValue(String(s.value))
    setEditStatus(s.status)
    setDetail(null)
  }

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      if (editingId == null) {
        const created = await createSensor(form)
        flash(`Создан сенсор #${created.id}`)
      } else {
        await updateSensor(editingId, {
          ...form,
          value: editValue === '' ? null : Number(editValue),
          status: editStatus,
        })
        flash(`Сенсор #${editingId} обновлён`)
      }
      resetForm()
      load()
    } catch (e) {
      setError(String(e))
    }
  }

  const remove = async (id: number) => {
    if (!confirm(`Удалить сенсор #${id}?`)) return
    setError('')
    try {
      await deleteSensor(id)
      flash(`Сенсор #${id} удалён`)
      if (detail?.id === id) setDetail(null)
      load()
    } catch (e) {
      setError(String(e))
    }
  }

  const showDetail = async (id: number) => {
    setError('')
    try {
      setDetail(await getSensor(id))
    } catch (e) {
      setError(String(e))
    }
  }

  const submitPatch = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const id = Number(patchId)
      await patchSensorValue(id, { value: Number(patchValue), status: patchStatus })
      flash(`Значение сенсора #${id} обновлено`)
      load()
    } catch (e) {
      setError(String(e))
    }
  }

  return (
    <section className="card">
      <div className="card-head">
        <h2>Сенсоры <span className="muted">smart_home · /api/v1/sensors</span></h2>
        <button className="ghost small" onClick={load}>Обновить</button>
      </div>

      {error && <div className="alert err">{error}</div>}
      {msg && <div className="alert ok">{msg}</div>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>id</th><th>name</th><th>type</th><th>location</th>
              <th>value</th><th>unit</th><th>status</th><th>обновлён</th><th></th>
            </tr>
          </thead>
          <tbody>
            {sensors.length === 0 && (
              <tr><td colSpan={9} className="muted center">нет сенсоров</td></tr>
            )}
            {sensors.map((s) => (
              <tr key={s.id}>
                <td>{s.id}</td>
                <td>{s.name}</td>
                <td>{s.type}</td>
                <td>{s.location}</td>
                <td>{s.value}</td>
                <td>{s.unit}</td>
                <td><span className={`badge ${s.status}`}>{s.status}</span></td>
                <td className="muted">{s.last_updated ? new Date(s.last_updated).toLocaleString() : '—'}</td>
                <td className="rowact">
                  <button className="link" onClick={() => showDetail(s.id)}>детали</button>
                  <button className="link" onClick={() => startEdit(s)}>изменить</button>
                  <button className="link danger" onClick={() => remove(s.id)}>удалить</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {detail && (
        <div className="detail">
          <div className="card-head">
            <strong>Детали #{detail.id} <span className="muted">GET /api/v1/sensors/{detail.id}</span></strong>
            <button className="ghost small" onClick={() => setDetail(null)}>×</button>
          </div>
          <pre>{JSON.stringify(detail, null, 2)}</pre>
        </div>
      )}

      <div className="forms">
        {/* create / update */}
        <form className="subform" onSubmit={submitForm}>
          <div className="subform-head">
            {editingId == null ? 'Создать сенсор (POST)' : `Изменить #${editingId} (PUT)`}
          </div>
          <div className="grid2">
            <label>name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
            <label>type<input required value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} /></label>
            <label>location<input required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></label>
            <label>unit<input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></label>
            {editingId != null && (
              <>
                <label>value<input type="number" step="any" value={editValue} onChange={(e) => setEditValue(e.target.value)} /></label>
                <label>status<input value={editStatus} onChange={(e) => setEditStatus(e.target.value)} /></label>
              </>
            )}
          </div>
          <div className="subform-actions">
            <button type="submit">{editingId == null ? 'Создать' : 'Сохранить'}</button>
            {editingId != null && <button type="button" className="ghost" onClick={resetForm}>Отмена</button>}
          </div>
        </form>

        {/* patch value */}
        <form className="subform" onSubmit={submitPatch}>
          <div className="subform-head">Обновить значение (PATCH /:id/value)</div>
          <div className="grid2">
            <label>id<input required type="number" value={patchId} onChange={(e) => setPatchId(e.target.value)} /></label>
            <label>value<input required type="number" step="any" value={patchValue} onChange={(e) => setPatchValue(e.target.value)} /></label>
            <label>status<input value={patchStatus} onChange={(e) => setPatchStatus(e.target.value)} /></label>
          </div>
          <div className="subform-actions">
            <button type="submit">Применить</button>
          </div>
        </form>
      </div>
    </section>
  )
}
