'use client'
import mqtt from 'mqtt'
import { useCallback, useEffect, useRef, useState } from 'react'

const TOPIC = 'robot/drive'

export default function Home() {
  const client = useRef<mqtt.MqttClient | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recording, setRecording] = useState<
    { message: string; delay: number }[]
  >([])
  const previousTime = useRef<number | null>(null)
  const stopRef = useRef(false)

  const [linearVelocity, setLinearVelocity] = useState(0)
  const [angularVelocity, setAngularVelocity] = useState(0)

  const play = useCallback(async () => {
    stopRef.current = false
    for (const { message, delay } of recording) {
      console.log(message, delay)

      await new Promise((resolve) => setTimeout(resolve, delay))
      client.current?.publish(TOPIC, message)
      console.log('published', message)

      if (stopRef.current) break
    }
  }, [recording])

  const handleKey = useCallback(
    (event: KeyboardEvent) => {
      const key = event.key
      // const keyToMessage: Record<string, string> = {
      //   w: 'forward',
      //   a: 'left',
      //   s: 'back',
      //   d: 'right',
      //   e: 'stop',
      // }
      // const message = keyToMessage[key]
      // if (!message) return
      let _linearVelocity = linearVelocity
      let _angularVelocity = angularVelocity
      if (key === 'w') {
        _linearVelocity += 0.2
      } else if (key === 's') {
        _linearVelocity -= 0.2
      } else if (key === 'a') {
        _angularVelocity += 0.1
      } else if (key === 'd') {
        _angularVelocity -= 0.1
      } else if (key === 'e') {
        _linearVelocity = 0
        _angularVelocity = 0
      }
      if (
        _linearVelocity === linearVelocity &&
        _angularVelocity === angularVelocity
      )
        return
      console.log(key, _linearVelocity, _angularVelocity)

      setLinearVelocity(_linearVelocity)
      setAngularVelocity(_angularVelocity)

      const message = JSON.stringify({
        linear_velocity: _linearVelocity,
        angular_velocity: _angularVelocity,
      })
      client.current?.publish(TOPIC, message)

      if (isRecording) {
        const currentTime = Date.now()
        const delay = previousTime.current
          ? currentTime - previousTime.current
          : 0
        setRecording((prev) => [...prev, { message, delay }])
        console.log('recorded', message, delay)
        previousTime.current = currentTime
      }
    },
    [angularVelocity, isRecording, linearVelocity],
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('keydown', handleKey)
    }
  }, [handleKey])

  useEffect(() => {
    // Extract username from URL or use hostname
    // const hostname = window.location.hostname // e.g., "beige-desktop.local" or "192.168.1.100"
    // const username = hostname.split('-')[0] // e.g., "beige" or use full hostname if no hyphen
    // const username = 'orange'

    // MQTT client setup - use the extracted username or full hostname
    // const mqttHost = username.includes('.')
    //   ? hostname
    //   : `${username}-desktop.local`
    const mqttHost = 'orange@orange-orange.local'
    client.current = mqtt.connect(`ws://${mqttHost}:9001`)

    client.current.on('connect', function () {
      console.log('connected')
    })

    client.current.on('error', function (error) {
      console.error('error', error)
    })

    client.current.on('message', function (topic, message) {
      console.log('Message received:', message.toString())
    })
  }, [])

  return (
    <div className="h-screen w-full bg-black flex flex-col justify-center items-center gap-10">
      <button onClick={() => setIsRecording((prev) => !prev)}>
        {isRecording ? 'stop' : 'record'}
      </button>
      <button onClick={play}>play</button>
      <button onClick={() => (stopRef.current = true)}>stop</button>
      <button
        onClick={() => {
          setRecording([])
          setIsRecording(false)
          stopRef.current = true
          previousTime.current = null
        }}
      >
        clear
      </button>
      <div className="flex flex-row gap-2 border border-white p-2 rounded-md max-w-md overflow-x-auto">
        {recording.map(({ message, delay }, index) => (
          <div key={index}>
            {message} {(delay / 1000).toFixed(2)}s
          </div>
        ))}
      </div>
      <button
        onClick={() => mqtt.connect(`ws://orange@orange-orange.local:9001`)}
      >
        connect
      </button>
    </div>
  )
}
