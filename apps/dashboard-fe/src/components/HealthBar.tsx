import { useCallback, useEffect, useState } from 'react'
import { HEALTH_PROBES, probe } from '../api'
import type { Health } from '../types'

export default function HealthBar() {
  const [states, setStates] = useState<Record<string, Health>>(
    Object.fromEntries(HEALTH_PROBES.map((p) => [p.name, 'unknown'])),
  )

  const check = useCallback(async () => {
    const entries = await Promise.all(
      HEALTH_PROBES.map(async (p) => [p.name, (await probe(p.url)) ? 'up' : 'down'] as const),
    )
    setStates(Object.fromEntries(entries))
  }, [])

  useEffect(() => {
    check()
    const t = setInterval(check, 5000)
    return () => clearInterval(t)
  }, [check])

  return (
    <div className="healthbar">
      {HEALTH_PROBES.map((p) => (
        <span key={p.name} className={`chip ${states[p.name]}`}>
          <span className="dot" />
          {p.name}
        </span>
      ))}
    </div>
  )
}
