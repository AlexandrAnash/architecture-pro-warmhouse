import HealthBar from './components/HealthBar'
import SensorsPanel from './components/SensorsPanel'
import TemperaturePanel from './components/TemperaturePanel'
import DevicesPanel from './components/DevicesPanel'
import TelemetryPanel from './components/TelemetryPanel'

export default function App() {
  return (
    <div className="app">
      <header className="app-head">
        <div>
          <h1>Smart Home · Dashboard</h1>
          <p className="muted">Данные всех сервисов через один origin (reverse-proxy /svc/*)</p>
        </div>
        <HealthBar />
      </header>

      {/* ── Монолит ── */}
      <section className="group mono">
        <div className="group-head">
          <span className="group-badge mono">Монолит</span>
          <span className="group-title">smart_home</span>
          <span className="muted">:8080 · /api/v1/sensors*</span>
        </div>
        <SensorsPanel />
      </section>

      {/* ── Микросервисы ── */}
      <section className="group micro">
        <div className="group-head">
          <span className="group-badge micro">Микросервисы</span>
          <span className="muted">temperature-api :8081 · device-manager :8082 · telemetry :8083</span>
        </div>
        <div className="grid-micro">
          <TemperaturePanel />
          <DevicesPanel />
          <TelemetryPanel />
        </div>
      </section>
    </div>
  )
}
