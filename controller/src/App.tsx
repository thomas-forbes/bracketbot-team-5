import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
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

type Setter<T> = Dispatch<SetStateAction<T>>;

function Sliders({
  linearVelocity,
  setLinearVelocity,
  angularVelocity,
  setAngularVelocity,
}: {
  linearVelocity: number;
  setLinearVelocity: Setter<number>;
  angularVelocity: number;
  setAngularVelocity: Setter<number>;
}) {
  return (
    <div className="flex h-full w-full max-w-2xl justify-between gap-4">
      <div className="flex items-center gap-4">
        <Button onClick={() => setLinearVelocity(0)} className="font-mono">
          0
        </Button>
        <Slider
          className="h-96"
          value={[linearVelocity]}
          min={-4}
          max={4}
          step={0.05}
          onValueChange={(value) => setLinearVelocity(value[0])}
        />
      </div>

      <div className="flex items-center gap-4">
        <Button onClick={() => setAngularVelocity(0)} className="font-mono">
          0
        </Button>
        <Slider
          className="h-96"
          value={[angularVelocity]}
          min={-2}
          max={2}
          step={0.05}
          onValueChange={(value) => setAngularVelocity(value[0])}
          onPointerUp={() => setAngularVelocity(0)}
        />
      </div>
    </div>
  );
}

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

  useEffect(() => {
    if (!client) {
      toast.error("No client");
      return;
    }
    const message = JSON.stringify({
      linear_velocity: linearVelocity,
      angular_velocity: angularVelocity,
    });
    console.log(linearVelocity, angularVelocity);

    client.current?.publish(TOPIC, message);
  }, [client, linearVelocity, angularVelocity]);

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-10 px-10">
      <Toaster />
      <div>
        <Badge
          variant={connected ? "default" : "destructive"}
          onClick={reconnect}
        >
          {connected ? "Connected" : "Disconnected"}
        </Badge>
      </div>
      <Sliders
        linearVelocity={linearVelocity}
        setLinearVelocity={setLinearVelocity}
        angularVelocity={angularVelocity}
        setAngularVelocity={setAngularVelocity}
      />
    </div>
  );
}

export default App;
