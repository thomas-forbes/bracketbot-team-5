import type { Setter } from "@/App";
import { cn } from "@/lib/utils";
import * as React from "react";

// Move constants outside component to prevent recreation
const BASE_SIZE = 300;
const KNOB_SIZE = 80;
const MAX_DISTANCE = (BASE_SIZE - KNOB_SIZE) / 2;

// Memoize base styles
const baseStyles = {
  width: BASE_SIZE,
  height: BASE_SIZE,
} as const;

const knobBaseStyles = {
  width: KNOB_SIZE,
  height: KNOB_SIZE,
  left: `${(BASE_SIZE - KNOB_SIZE) / 2}px`,
  top: `${(BASE_SIZE - KNOB_SIZE) / 2}px`,
} as const;

interface JoystickProps {
  setLinearVelocity: Setter<number>;
  setAngularVelocity: Setter<number>;
  maxLinearVelocity: number;
  maxAngularVelocity: number;
  className?: string;
}

export function Joystick({
  setLinearVelocity,
  setAngularVelocity,
  maxLinearVelocity,
  maxAngularVelocity,
  className,
}: JoystickProps) {
  const joystickRef = React.useRef<HTMLDivElement>(null);
  const knobRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });

  const calculateVelocities = React.useCallback(
    (x: number, y: number) => {
      // Normalize coordinates to -1 to 1 range
      const normalizedX = x / MAX_DISTANCE;
      const normalizedY = y / MAX_DISTANCE;

      // Calculate magnitude (0 to 1)
      const magnitude = Math.min(
        Math.sqrt(normalizedX * normalizedX + normalizedY * normalizedY),
        1,
      );

      // Linear scaling - direct multiplication with magnitude
      setLinearVelocity(-normalizedY * maxLinearVelocity * magnitude);
      setAngularVelocity(-normalizedX * maxAngularVelocity * magnitude);
    },
    [
      maxLinearVelocity,
      maxAngularVelocity,
      setLinearVelocity,
      setAngularVelocity,
    ],
  );

  const handleMove = React.useCallback(
    (clientX: number, clientY: number) => {
      if (!isDragging || !joystickRef.current) return;

      const rect = joystickRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      let deltaX = clientX - centerX;
      let deltaY = clientY - centerY;

      // Calculate distance from center
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      // If distance is greater than maxDistance, normalize the coordinates
      if (distance > MAX_DISTANCE) {
        const angle = Math.atan2(deltaY, deltaX);
        deltaX = Math.cos(angle) * MAX_DISTANCE;
        deltaY = Math.sin(angle) * MAX_DISTANCE;
      }

      setPosition({ x: deltaX, y: deltaY });
      calculateVelocities(deltaX, deltaY);
    },
    [isDragging, calculateVelocities],
  );

  const handleStart = React.useCallback(
    (clientX: number, clientY: number) => {
      setIsDragging(true);
      handleMove(clientX, clientY);
    },
    [handleMove],
  );

  const handleEnd = React.useCallback(() => {
    setIsDragging(false);
    setPosition({ x: 0, y: 0 });
    setLinearVelocity(0);
    setAngularVelocity(0);
  }, [setLinearVelocity, setAngularVelocity]);

  // Memoize the knob style to prevent unnecessary object creation
  const knobStyle = React.useMemo(
    () => ({
      ...knobBaseStyles,
      transform: `translate(${position.x}px, ${position.y}px)`,
    }),
    [position.x, position.y],
  );

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      handleMove(touch.clientX, touch.clientY);
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleEnd);
      window.addEventListener("touchmove", handleTouchMove);
      window.addEventListener("touchend", handleEnd);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [isDragging, handleMove, handleEnd]);

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div
        ref={joystickRef}
        className="relative touch-none select-none rounded-full bg-secondary p-4"
        style={baseStyles}
        onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
        onTouchStart={(e) => {
          e.preventDefault();
          const touch = e.touches[0];
          handleStart(touch.clientX, touch.clientY);
        }}
      >
        <div
          ref={knobRef}
          className="absolute rounded-full bg-primary"
          style={knobStyle}
        />
      </div>
    </div>
  );
}
