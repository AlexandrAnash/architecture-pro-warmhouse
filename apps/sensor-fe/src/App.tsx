import { useCallback, useEffect, useRef, useState } from 'react'
import { useStomp } from './useStomp'
import type { DeviceStatus, LogEntry, Telemetry } from './types'

const EXCHANGE = 'smarthome'
const ROUTING_KEY = 'telemetry.reading'
const DESTINATION = `/exchange/${EXCHANGE}/${ROUTING_KEY}`

const STATUSES: DeviceStatus[] = ['active', 'idle', 'charging', 'offline']

// период потокового режима
const STREAM_MS = 100

function loadSeq(): number {
  return Number(localStorage.getItem('readingSeq') || 0)
}
function saveSeq(v: number) {
  localStorage.setItem('readingSeq', String(v))
}

const STATE_LABEL: Record<string, string> = {
  disconnected: 'не подключено',
  connecting: 'подключение…',
  connected: 'подключено',
  error: 'ошибка',
}

export default function App() {
  // соединение
  const [url, setUrl] = useState('ws://localhost:15674/ws')
  const [login, setLogin] = useState('smarthome')
  const [passcode, setPasscode] = useState('smarthome')

  // показание
  const [deviceId, setDeviceId] = useState(1)
  const [battery, setBattery] = useState(80)
  const [status, setStatus] = useState<DeviceStatus>('active')

  // авто-отправка
  const [auto, setAuto] = useState(false)
  const [intervalSec, setIntervalSec] = useState(3)

  // потоковый режим (~100 мс)
  const [stream, setStream] = useState(false)
  const [sentCount, setSentCount] = useState(0)
  const sentCountRef = useRef(0)

  const [logs, setLogs] = useState<LogEntry[]>([])
  const logIdRef = useRef(0)
  const seqRef = useRef(loadSeq())

  const addLog = useCallback((kind: LogEntry['kind'], text: string) => {
    setLogs((prev) => {
      const next = [...prev, { id: logIdRef.current++, ts: Date.now(), kind, text }]
      return next.slice(-200)
    })
  }, [])

  const { state, connect, disconnect, publish } = useStomp(addLog)
  const connected = state === 'connected'

  useEffect(() => {
    addLog('sys', 'Готов. Нажми «Подключиться».')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // держим свежие значения формы для авто-таймера, без пересоздания интервала
  const readingRef = useRef({ deviceId, battery, status })
  readingRef.current = { deviceId, battery, status }

  // verbose=false — для потокового режима: шлём, но не пишем каждое TX в лог
  const sendReading = useCallback((verbose = true) => {
    const seq = seqRef.current + 1
    seqRef.current = seq
    saveSeq(seq)

    const { deviceId, battery, status } = readingRef.current
    const payload: Telemetry = {
      id: seq,
      device_id: deviceId,
      battery,
      status,
      created_at: Date.now(),
    }
    const ok = publish(DESTINATION, JSON.stringify(payload))
    if (ok) {
      sentCountRef.current += 1
      if (verbose) addLog('tx', `TX → ${DESTINATION}  ${JSON.stringify(payload)}`)
    } else if (verbose) {
      addLog('err', 'Не отправлено: нет соединения')
    }
    return ok
  }, [publish, addLog])

  // авто-отправка (интервал в секундах)
  useEffect(() => {
    if (!auto || !connected) return
    sendReading() // сразу первое
    const ms = Math.max(1, intervalSec) * 1000
    const t = setInterval(() => sendReading(), ms)
    return () => clearInterval(t)
  }, [auto, connected, intervalSec, sendReading])

  // потоковый режим (~STREAM_MS): высокая частота, без лога на каждое TX
  useEffect(() => {
    if (!stream || !connected) return
    const rate = Math.round(1000 / STREAM_MS)
    addLog('sys', `Поток включён: ~${STREAM_MS} мс (${rate}/с)`)
    const send = setInterval(() => sendReading(false), STREAM_MS)
    // счётчик отправленных обновляем раз в 500 мс, чтобы не рендерить на каждое сообщение
    const tick = setInterval(() => setSentCount(sentCountRef.current), 500)
    return () => {
      clearInterval(send)
      clearInterval(tick)
      setSentCount(sentCountRef.current)
      addLog('sys', `Поток выключен (отправлено ${sentCountRef.current})`)
    }
  }, [stream, connected, sendReading, addLog])

  // если соединение отвалилось — выключаем авто и поток
  useEffect(() => {
    if (!connected) {
      if (auto) setAuto(false)
      if (stream) setStream(false)
    }
  }, [connected, auto, stream])

  const onConnect = () => connect({ url: url.trim(), login, passcode })

  const dotClass =
    state === 'connected' ? 'dot on' : state === 'error' ? 'dot err' : 'dot'

  return (
    <div className="wrap">
      <h1>FE-датчик · Web-STOMP → RabbitMQ</h1>
      <p className="sub">
        Публикация в exchange <code>{EXCHANGE}</code> с routing key{' '}
        <code>{ROUTING_KEY}</code> → очередь <code>telemetry-queue</code>
      </p>

      {/* Подключение */}
      <div className="card">
        <div className="row">
          <div className="col grow2">
            <label>WebSocket URL</label>
            <input value={url} onChange={(e) => setUrl(e.target.value)} disabled={state !== 'disconnected'} />
          </div>
          <div className="col">
            <label>Login</label>
            <input value={login} onChange={(e) => setLogin(e.target.value)} disabled={state !== 'disconnected'} />
          </div>
          <div className="col">
            <label>Passcode</label>
            <input
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              disabled={state !== 'disconnected'}
            />
          </div>
        </div>
        <div className="row actions">
          <button onClick={onConnect} disabled={state !== 'disconnected'}>
            Подключиться
          </button>
          <button className="ghost" onClick={disconnect} disabled={state === 'disconnected'}>
            Отключиться
          </button>
          <div className="status">
            <span className={dotClass} />
            <span>{STATE_LABEL[state]}</span>
          </div>
        </div>
      </div>

      {/* Показание */}
      <div className="card">
        <div className="row">
          <div className="col">
            <label>device_id</label>
            <input
              type="number"
              min={1}
              value={deviceId}
              onChange={(e) => setDeviceId(Number(e.target.value))}
            />
          </div>
          <div className="col">
            <label>
              battery: <span className="range-val">{battery}</span>%
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={battery}
              onChange={(e) => setBattery(Number(e.target.value))}
            />
          </div>
          <div className="col">
            <label>status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as DeviceStatus)}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="row actions">
          <button onClick={() => sendReading()} disabled={!connected || auto || stream}>
            Отправить показание
          </button>
          <label className="inline">
            <input
              type="checkbox"
              checked={auto}
              onChange={(e) => {
                setAuto(e.target.checked)
                if (e.target.checked) setStream(false)
              }}
              disabled={!connected || stream}
            />
            авто каждые
          </label>
          <div className="col narrow">
            <input
              type="number"
              min={1}
              value={intervalSec}
              onChange={(e) => setIntervalSec(Number(e.target.value))}
              disabled={stream}
            />
          </div>
          <span className="muted">сек</span>
        </div>
        <div className="row actions">
          <label className="inline">
            <input
              type="checkbox"
              checked={stream}
              onChange={(e) => {
                setStream(e.target.checked)
                if (e.target.checked) setAuto(false)
              }}
              disabled={!connected || auto}
            />
            поток ~{STREAM_MS} мс ({Math.round(1000 / STREAM_MS)}/с)
          </label>
          <span className="muted">отправлено: {sentCount}</span>
        </div>
        <p className="hint">
          Каждое показание получает уникальный <code>id</code> (ключ реестра телеметрии) — история
          копится, <code>device_id</code> остаётся идентификатором устройства.
        </p>
      </div>

      {/* Лог */}
      <div className="card">
        <div className="row loghead">
          <strong>Лог</strong>
          <button className="ghost small" onClick={() => setLogs([])}>
            Очистить
          </button>
        </div>
        <div className="log">
          {logs.map((l) => (
            <div key={l.id} className={`logline ${l.kind}`}>
              [{new Date(l.ts).toLocaleTimeString()}] {l.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
