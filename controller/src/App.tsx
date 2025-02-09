import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Joystick } from "@/components/ui/joystick";
import mqtt from "mqtt";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { toast, Toaster } from "sonner";

export type Setter<T> = Dispatch<SetStateAction<T>>;

const HOST = "orange@orange-orange.local";
const TOPIC = "robot/drive";
function useMqtt() {
  const client = useRef<mqtt.MqttClient | null>(null);
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    client.current = mqtt.connect(`ws://${HOST}:9001`);
    client.current.on("connect", () => {
      setConnected(true);
    });
    client.current.on("error", (error) => {
      console.error(error);
      toast.error("Error: " + error);
      setConnected(false);
    });

    return () => {
      client.current?.end();
      setConnected(false);
    };
  }, []);

  const reconnect = useCallback(() => {
    client.current?.end();
    setConnected(false);
    client.current = mqtt.connect(`ws://${HOST}:9001`);
    client.current.on("connect", () => {
      setConnected(true);
    });
  }, []);

  return { client, connected, reconnect };
}

function App() {
  const { client, connected, reconnect } = useMqtt();

  const [linearVelocity, setLinearVelocity] = useState(0);
  const [angularVelocity, setAngularVelocity] = useState(0);

  const [maxLinearVelocity, setMaxLinearVelocity] = useState(3);
  const [maxAngularVelocity, setMaxAngularVelocity] = useState(2);

  useEffect(() => {
    if (!client) {
      toast.error("No client");
      return;
    }
    const message = JSON.stringify({
      linear_velocity: linearVelocity * -1,
      angular_velocity: angularVelocity,
    });
    console.log(linearVelocity, angularVelocity);

    client.current?.publish(TOPIC, message);
  }, [client, linearVelocity, angularVelocity]);

  return (
    <div className="flex h-svh w-svw flex-col items-center justify-between px-10 py-2">
      <Toaster />
      <div className="flex items-center gap-2">
        <Badge
          variant={connected ? "default" : "destructive"}
          onClick={reconnect}
        >
          {connected ? "Connected" : "Disconnected"}
        </Badge>
        <Input
          type="number"
          value={maxLinearVelocity}
          onChange={(e) => setMaxLinearVelocity(Number(e.target.value))}
        />
        <Input
          type="number"
          value={maxAngularVelocity}
          onChange={(e) => setMaxAngularVelocity(Number(e.target.value))}
        />
      </div>
      <Joystick
        maxLinearVelocity={maxLinearVelocity}
        maxAngularVelocity={maxAngularVelocity}
        linearVelocity={linearVelocity}
        setLinearVelocity={setLinearVelocity}
        angularVelocity={angularVelocity}
        setAngularVelocity={setAngularVelocity}
      />
    </div>
  );
}

export default App;
