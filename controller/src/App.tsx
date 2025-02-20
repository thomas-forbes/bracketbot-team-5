import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { useInterval } from "react-use";
import { toast, Toaster } from "sonner";

export type Setter<T> = Dispatch<SetStateAction<T>>;

const HOST = "thomas@bracketbot.local";
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

const ACCEL = 10;
const DECEL = 10;
const INTERVAL = 100;
const INTERVAL_MULTIPLIER = INTERVAL / 1000;

function App() {
  const { client, connected, reconnect } = useMqtt();
  const [invert, setInvert] = useState(false);

  const [targetLinearVelocity, setTargetLinearVelocity] = useState(0);
  const [targetAngularVelocity, setTargetAngularVelocity] = useState(0);

  const [maxLinearVelocity, setMaxLinearVelocity] = useState(3);
  const [maxAngularVelocity, setMaxAngularVelocity] = useState(2);

  const realVelocity = useRef({
    linear: 0,
    angular: 0,
  });

  const lastMessageRef = useRef<string | null>(null);

  useInterval(() => {
    // Calculate new linear velocity
    const linearDiff = targetLinearVelocity - realVelocity.current.linear;
    if (Math.abs(linearDiff) < DECEL) {
      realVelocity.current.linear = targetLinearVelocity;
    } else if (linearDiff > 0) {
      realVelocity.current.linear += ACCEL * INTERVAL_MULTIPLIER;
    } else {
      realVelocity.current.linear -= DECEL * INTERVAL_MULTIPLIER;
    }

    // Calculate new angular velocity
    const angularDiff = targetAngularVelocity - realVelocity.current.angular;
    if (Math.abs(angularDiff) < DECEL) {
      realVelocity.current.angular = targetAngularVelocity;
    } else if (angularDiff > 0) {
      realVelocity.current.angular += ACCEL * INTERVAL_MULTIPLIER;
    } else {
      realVelocity.current.angular -= DECEL * INTERVAL_MULTIPLIER;
    }

    const message = JSON.stringify({
      linear_velocity: realVelocity.current.linear * (invert ? -1 : 1),
      angular_velocity: realVelocity.current.angular,
    });

    // Only send if message changed
    if (message !== lastMessageRef.current) {
      lastMessageRef.current = message;

      if (!client) {
        toast.error("No client");
        return;
      }

      console.log(message);

      client.current?.publish(TOPIC, message);
    }
  }, INTERVAL);

  const zero = useCallback(() => {
    setTargetLinearVelocity(0);
    setTargetAngularVelocity(0);
    realVelocity.current.linear = 0;
    realVelocity.current.angular = 0;
  }, []);

  // useEffect(() => {
  //   if (!client) {
  //     toast.error("No client");
  //     return;
  //   }
  //   const message = JSON.stringify({
  //     linear_velocity: targetLinearVelocity * (invert ? -1 : 1),
  //     angular_velocity: targetAngularVelocity * (invert ? -1 : 1),
  //   });
  //   console.log(targetLinearVelocity, targetAngularVelocity);

  //   client.current?.publish(TOPIC, message);
  // }, [client, targetLinearVelocity, targetAngularVelocity, invert]);

  return (
    <div className="flex h-svh w-svw flex-col items-center justify-between px-10 py-2">
      <Toaster />
      <div className="flex flex-col items-stretch gap-2">
        <Badge
          variant={connected ? "default" : "destructive"}
          onClick={reconnect}
        >
          {connected ? "Connected" : "Disconnected"}
        </Badge>
        <Button onClick={() => setInvert(!invert)}>Invert</Button>
        <Button onClick={zero}>Zero</Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setMaxLinearVelocity(maxLinearVelocity - 1)}
          >
            -
          </Button>
          <Input
            type="number"
            value={maxLinearVelocity}
            onChange={(e) => setMaxLinearVelocity(Number(e.target.value))}
          />
          <Button
            variant="outline"
            onClick={() => setMaxLinearVelocity(maxLinearVelocity + 1)}
          >
            +
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setMaxAngularVelocity(maxAngularVelocity - 1)}
          >
            -
          </Button>
          <Input
            type="number"
            value={maxAngularVelocity}
            onChange={(e) => setMaxAngularVelocity(Number(e.target.value))}
          />
          <Button
            variant="outline"
            onClick={() => setMaxAngularVelocity(maxAngularVelocity + 1)}
          >
            +
          </Button>
        </div>
      </div>
      <Joystick
        maxLinearVelocity={maxLinearVelocity}
        maxAngularVelocity={maxAngularVelocity}
        setLinearVelocity={setTargetLinearVelocity}
        setAngularVelocity={setTargetAngularVelocity}
      />
    </div>
  );
}

export default App;
