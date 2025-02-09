import Slider from '@react-native-community/slider'
import {
  useCallback,
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react'
import { Alert, Platform, Text, TouchableOpacity, View } from 'react-native'
import { BleManager, Device } from 'react-native-ble-plx'

type Setter<T> = Dispatch<SetStateAction<T>>

const MAX_LINEAR_VELOCITY = 3
const MAX_ANGULAR_VELOCITY = 1
const SERVICE_UUID = 'A07498CA-AD5B-474E-940D-16F1FBE7E8CD'
const CHARACTERISTIC_UUID = '51FF12BB-3ED8-46E5-B4F9-D64E2FEC021B'

const bleManager = new BleManager()

function Sliders({
  linearVelocity,
  setLinearVelocity,
  angularVelocity,
  setAngularVelocity,
}: {
  linearVelocity: number
  setLinearVelocity: Setter<number>
  angularVelocity: number
  setAngularVelocity: Setter<number>
}) {
  const [linearVelocityProxy, setLinearVelocityProxy] = useState(0)
  useEffect(() => {
    setLinearVelocity(
      Math.pow(linearVelocityProxy, 2) *
        MAX_LINEAR_VELOCITY *
        (linearVelocityProxy < 0 ? -1 : 1),
    )
  }, [linearVelocityProxy, setLinearVelocity])

  useEffect(() => {
    setLinearVelocityProxy(
      Math.sqrt(Math.abs(linearVelocity) / MAX_LINEAR_VELOCITY) *
        (linearVelocity < 0 ? -1 : 1),
    )
  }, [linearVelocity])

  const [angularVelocityProxy, setAngularVelocityProxy] = useState(0)
  useEffect(() => {
    setAngularVelocity(
      Math.pow(angularVelocityProxy, 2) * (angularVelocityProxy < 0 ? -1 : 1),
    )
  }, [angularVelocityProxy, setAngularVelocity])

  useEffect(() => {
    setAngularVelocityProxy(
      Math.sqrt(Math.abs(angularVelocity) / MAX_ANGULAR_VELOCITY) *
        (angularVelocity < 0 ? -1 : 1),
    )
  }, [angularVelocity])

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        maxWidth: 600,
        gap: 24,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <TouchableOpacity
          onPress={() => setLinearVelocity(0)}
          style={{ padding: 10, backgroundColor: '#e2e8f0', borderRadius: 8 }}
        >
          <Text style={{ fontFamily: 'monospace' }}>0</Text>
        </TouchableOpacity>

        <View style={{ width: 320 }}>
          <Slider
            value={linearVelocityProxy}
            minimumValue={-1}
            maximumValue={1}
            step={0.1}
            onValueChange={setLinearVelocityProxy}
            onSlidingComplete={() => setLinearVelocityProxy(0)}
          />
        </View>
      </View>

      <View style={{ alignItems: 'center', flexDirection: 'row', gap: 16 }}>
        <TouchableOpacity
          onPress={() => setAngularVelocityProxy(0)}
          style={{ padding: 10, backgroundColor: '#e2e8f0', borderRadius: 8 }}
        >
          <Text style={{ fontFamily: 'monospace' }}>0</Text>
        </TouchableOpacity>
        <View style={{ width: 320 }}>
          <Slider
            value={angularVelocityProxy}
            minimumValue={-1}
            maximumValue={1}
            step={0.1}
            onValueChange={setAngularVelocityProxy}
            onSlidingComplete={() => setAngularVelocityProxy(0)}
          />
        </View>
      </View>
    </View>
  )
}

function App() {
  const [linearVelocity, setLinearVelocity] = useState(0)
  const [angularVelocity, setAngularVelocity] = useState(0)
  const [device, setDevice] = useState<Device | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)

  const sendVelocities = useCallback(async () => {
    if (!device) return

    try {
      const data = JSON.stringify({
        linear: linearVelocity,
        angular: angularVelocity,
      })
      await device.writeCharacteristicWithResponseForService(
        SERVICE_UUID,
        CHARACTERISTIC_UUID,
        Buffer.from(data).toString('base64'),
      )
    } catch (error) {
      console.error('Failed to send velocities:', error)
    }
  }, [device, linearVelocity, angularVelocity])

  useEffect(() => {
    if (device) {
      sendVelocities()
    }
  }, [linearVelocity, angularVelocity, device, sendVelocities])

  const connectToDevice = async () => {
    if (Platform.OS !== 'ios') {
      Alert.alert(
        'Error',
        'Bluetooth functionality is currently only supported on iOS',
      )
      return
    }

    try {
      setIsConnecting(true)

      return new Promise((resolve, reject) => {
        bleManager.startDeviceScan([SERVICE_UUID], null, (error, device) => {
          if (error) {
            bleManager.stopDeviceScan()
            reject(error)
            return
          }

          if (device) {
            bleManager.stopDeviceScan()
            device
              .connect()
              .then(() => device.discoverAllServicesAndCharacteristics())
              .then(() => {
                setDevice(device)
                Alert.alert('Success', 'Connected to device successfully!')
                resolve(device)
              })
              .catch(reject)
          }
        })

        // Stop scanning after 5 seconds
        setTimeout(() => {
          bleManager.stopDeviceScan()
          reject(new Error('No devices found'))
        }, 5000)
      })
    } catch (error) {
      Alert.alert('Error', 'Failed to connect to device')
      console.error(error)
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
      }}
    >
      <TouchableOpacity
        onPress={connectToDevice}
        disabled={isConnecting}
        style={{
          padding: 12,
          backgroundColor: device ? '#4ade80' : '#e2e8f0',
          borderRadius: 8,
          marginBottom: 16,
        }}
      >
        <Text style={{ fontFamily: 'monospace' }}>
          {isConnecting
            ? 'Connecting...'
            : device
            ? 'Connected'
            : 'Connect to Device'}
        </Text>
      </TouchableOpacity>

      <Sliders
        linearVelocity={linearVelocity}
        setLinearVelocity={setLinearVelocity}
        angularVelocity={angularVelocity}
        setAngularVelocity={setAngularVelocity}
      />
    </View>
  )
}

export default App
