import { useCallback, useEffect, useRef, useState } from 'react'
import { Client, type IFrame } from '@stomp/stompjs'
import type { ConnState } from './types'

export interface StompConfig {
  url: string
  login: string
  passcode: string
}

type LogFn = (kind: 'tx' | 'sys' | 'err', text: string) => void

export function useStomp(onLog: LogFn) {
  const clientRef = useRef<Client | null>(null)
  const [state, setState] = useState<ConnState>('disconnected')

  // держим актуальный логгер в ref, чтобы колбэки клиента не пересоздавались
  const logRef = useRef<LogFn>(onLog)
  useEffect(() => {
    logRef.current = onLog
  }, [onLog])

  const connect = useCallback((cfg: StompConfig) => {
    // на всякий случай гасим прошлое соединение
    clientRef.current?.deactivate()

    const client = new Client({
      brokerURL: cfg.url,
      connectHeaders: { login: cfg.login, passcode: cfg.passcode },
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
    })

    client.onConnect = () => {
      setState('connected')
      logRef.current('sys', `Подключено к ${cfg.url}`)
    }
    client.onStompError = (frame: IFrame) => {
      setState('error')
      logRef.current('err', `STOMP error: ${frame.headers['message'] ?? ''} — ${frame.body}`)
    }
    client.onWebSocketError = () => {
      setState('error')
      logRef.current('err', 'WebSocket error — проверь порт 15674 и плагин rabbitmq_web_stomp')
    }
    client.onWebSocketClose = () => {
      setState((prev) => (prev === 'error' ? prev : 'disconnected'))
      logRef.current('sys', 'Соединение закрыто')
    }

    setState('connecting')
    logRef.current('sys', `Подключаюсь к ${cfg.url} как ${cfg.login}…`)
    client.activate()
    clientRef.current = client
  }, [])

  const disconnect = useCallback(() => {
    clientRef.current?.deactivate()
    clientRef.current = null
    setState('disconnected')
  }, [])

  const publish = useCallback((destination: string, body: string): boolean => {
    const client = clientRef.current
    if (!client || !client.connected) return false
    client.publish({
      destination,
      body,
      headers: { 'content-type': 'application/json' },
    })
    return true
  }, [])

  // гасим соединение при размонтировании
  useEffect(() => {
    return () => {
      clientRef.current?.deactivate()
    }
  }, [])

  return { state, connect, disconnect, publish }
}
