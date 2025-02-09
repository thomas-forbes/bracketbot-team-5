'use client'
import { Slider } from '@/components/ui/slider'
import mqtt from 'mqtt'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useInterval } from 'react-use'

const TOPIC = 'robot/drive'

export default function Home() {
  const client = useRef<mqtt.MqttClient | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recording, setRecording] = useState<
    { message: string; delay: number }[]
  >([])
  const previousTime = useRef<number | null>(null)
  const stopRef = useRef(false)
  const headingRef = useRef(0)

  const [linearVelocity, setLinearVelocity] = useState(0)
  // const [angularVelocity, setAngularVelocity] = useState(0)
  const [angularVelocityQueue, setAngularVelocityQueue] = useState<
    {
      velocity: number
      timestamp: number
    }[]
  >([])

  const play = useCallback(async () => {
    stopRef.current = false
    for (const { message, delay } of recording) {
      console.log(message, delay)
      const data = JSON.parse(message)
      const headingDiff = headingRef.current - data.heading
      data.angular_velocity += headingDiff / 2
      const newMessage = JSON.stringify(data)

      await new Promise((resolve) => setTimeout(resolve, delay))
      client.current?.publish(TOPIC, newMessage)
      console.log('published', newMessage)

      if (stopRef.current) break
    }
  }, [recording])

  const [angularVelocityMaxTimeMs, setAngularVelocityMaxTimeMs] = useState(1000)
  const calculateAngularVelocity = useCallback(() => {
    const currentTime = Date.now()
    const velocity = angularVelocityQueue.reduce(
      (acc, { velocity, timestamp }) => {
        const deltaTime = currentTime - timestamp
        if (deltaTime > angularVelocityMaxTimeMs) return acc
        return acc + velocity * (1 - deltaTime / angularVelocityMaxTimeMs)
      },
      0,
    )
    return velocity
  }, [angularVelocityMaxTimeMs, angularVelocityQueue])

  const handleKey = useCallback(
    (event: KeyboardEvent) => {
      const key = event.key

      let _linearVelocity = linearVelocity
      // let _angularVelocity = angularVelocity
      if (key === 'w') {
        _linearVelocity -= 0.2
      } else if (key === 's') {
        _linearVelocity += 0.2
      } else if (key === 'a') {
        // _angularVelocity += 0.1
        setAngularVelocityQueue((prev) => [
          ...prev,
          { timestamp: Date.now(), velocity: 0.1 },
        ])
      } else if (key === 'd') {
        // _angularVelocity -= 0.1
        setAngularVelocityQueue((prev) => [
          ...prev,
          { timestamp: Date.now(), velocity: -0.1 },
        ])
      } else if (key === ' ') {
        _linearVelocity = 0
        setAngularVelocityQueue([])
        // _angularVelocity = 0
      } else if (key === 'e') {
        // _angularVelocity = 0
        setAngularVelocityQueue([])
      } else {
        return
      }

      setLinearVelocity(_linearVelocity)
      // setAngularVelocity(_angularVelocity)
    },
    [linearVelocity],
  )

  const lastMessageRef = useRef<string | null>(null)
  const sendMessage = useCallback(() => {
    const angularVelocity = calculateAngularVelocity()

    const message = JSON.stringify({
      linear_velocity: linearVelocity,
      angular_velocity: angularVelocity,
      heading: headingRef.current,
    })
    if (message === lastMessageRef.current) return
    lastMessageRef.current = message
    console.log(linearVelocity, angularVelocity)

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
  }, [calculateAngularVelocity, isRecording, linearVelocity])

  useInterval(sendMessage, 100)

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
      if (topic === 'robot/heading') {
        headingRef.current = Number(message.toString())
      }
    })
  }, [])
  return (
    <div className="min-h-screen w-screen bg-background flex items-center justify-center dark">
      <Slider
        value={[linearVelocity]}
        min={-2}
        max={2}
        step={0.1}
        onValueChange={(value) => setLinearVelocity(value[0])}
        className="h-96"
      />
      <button onClick={() => setLinearVelocity(0)}>0</button>
    </div>
  )
}
//   return (
//     <div className="h-screen w-full bg-black flex flex-col justify-center items-center gap-10">

//       <input
//         type="number"
//         className="bg-black"
//         value={angularVelocityMaxTimeMs}
//         onChange={(e) => setAngularVelocityMaxTimeMs(Number(e.target.value))}
//       />
//       <button onClick={() => setIsRecording((prev) => !prev)}>
//         {isRecording ? 'stop' : 'record'}
//       </button>
//       <button onClick={play}>play</button>
//       <button onClick={() => (stopRef.current = true)}>stop</button>
//       <button
//         onClick={() => {
//           setRecording([])
//           setIsRecording(false)
//           stopRef.current = true
//           previousTime.current = null
//         }}
//       >
//         clear
//       </button>
//       <div className="flex flex-row gap-2 border border-white p-2 rounded-md max-w-md overflow-x-auto">
//         {recording.map(({ message, delay }, index) => (
//           <div key={index}>
//             {message} {(delay / 1000).toFixed(2)}s
//           </div>
//         ))}
//       </div>
//       <button
//         onClick={() => mqtt.connect(`ws://orange@orange-orange.local:9001`)}
//       >
//         connect
//       </button>
//       {/* <p>{linearVelocity}</p> */}
//       {/* <p>{calculateAngularVelocity()}</p> */}
//     </div>
//   )
// }
