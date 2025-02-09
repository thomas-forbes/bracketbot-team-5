import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const MAX_ANGULAR_VELOCITY = 2;

function Sliders({
  linearVelocity,
  setLinearVelocity,
  angularVelocity,
  setAngularVelocity,
  maxLinearVelocity,
}: {
  linearVelocity: number;
  setLinearVelocity: Setter<number>;
  angularVelocity: number;
  setAngularVelocity: Setter<number>;
  maxLinearVelocity: number;
}) {
  const [linearVelocityProxy, setLinearVelocityProxy] = useState(0);
  useEffect(() => {
    setLinearVelocity(
      Math.pow(linearVelocityProxy, 2) *
        maxLinearVelocity *
        (linearVelocityProxy < 0 ? -1 : 1),
    );
  }, [linearVelocityProxy, maxLinearVelocity, setLinearVelocity]);

  useEffect(() => {
    setLinearVelocityProxy(
      Math.sqrt(Math.abs(linearVelocity) / maxLinearVelocity) *
        (linearVelocity < 0 ? -1 : 1),
    );
  }, [linearVelocity, maxLinearVelocity]);

  return (
    <div className="flex h-full w-full max-w-2xl flex-col items-center justify-center gap-4">
      <div className="flex items-center gap-4">
        <Button onClick={() => setLinearVelocity(0)} className="font-mono">
          0
        </Button>
        <Slider
          className="h-96"
          value={[linearVelocityProxy]}
          min={-1}
          max={1}
          step={0.1}
          onValueChange={(value) => setLinearVelocityProxy(value[0])}
          onPointerUp={() => setLinearVelocityProxy(0)}
        />
      </div>

      <div className="flex flex-col items-center gap-4">
        <Slider
          orientation="horizontal"
          className="w-80"
          value={[angularVelocity]}
          min={-MAX_ANGULAR_VELOCITY}
          max={MAX_ANGULAR_VELOCITY}
          step={MAX_ANGULAR_VELOCITY / 12}
          onValueChange={(value) => setAngularVelocity(value[0])}
          onPointerUp={() => setAngularVelocity(0)}
        />
        <Button onClick={() => setAngularVelocity(0)} className="font-mono">
          0
        </Button>
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
  const [maxLinearVelocity, setMaxLinearVelocity] = useState(3);

  useEffect(() => {
    if (!client) {
      toast.error("No client");
      return;
    }
    const message = JSON.stringify({
      linear_velocity: linearVelocity * -1,
      angular_velocity: angularVelocity * -1,
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
      </div>
      <Sliders
        maxLinearVelocity={maxLinearVelocity}
        linearVelocity={linearVelocity}
        setLinearVelocity={setLinearVelocity}
        angularVelocity={angularVelocity}
        setAngularVelocity={setAngularVelocity}
      />
    </div>
  );
}

export default App;
