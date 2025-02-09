import type { Setter } from "@/App";
import { cn } from "@/lib/utils";
import * as React from "react";

interface JoystickProps {
  linearVelocity: number;
  setLinearVelocity: Setter<number>;
  angularVelocity: number;
  setAngularVelocity: Setter<number>;
  maxLinearVelocity: number;
  maxAngularVelocity: number;
  className?: string;
}

export function Joystick({
  linearVelocity,
  setLinearVelocity,
  angularVelocity,
  setAngularVelocity,
  maxLinearVelocity,
  maxAngularVelocity,
  className,
}: JoystickProps) {
  const joystickRef = React.useRef<HTMLDivElement>(null);
  const knobRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const baseSize = 200; // Size of the joystick base
  const knobSize = 60; // Size of the knob
  const maxDistance = (baseSize - knobSize) / 2;

  const calculateVelocities = React.useCallback(
    (x: number, y: number) => {
      // Normalize coordinates to -1 to 1 range
      const normalizedX = x / maxDistance;
      const normalizedY = y / maxDistance;

      // Calculate magnitude (0 to 1)
      const magnitude = Math.min(
        Math.sqrt(normalizedX * normalizedX + normalizedY * normalizedY),
        1,
      );

      // Apply quadratic scaling to linear velocity for better control
      const scaledMagnitude = Math.pow(magnitude, 2);

      // Forward/backward movement (inverted Y axis)
      setLinearVelocity(-normalizedY * maxLinearVelocity * scaledMagnitude);

      // Left/right rotation
      setAngularVelocity(-normalizedX * maxAngularVelocity * scaledMagnitude);
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
      if (distance > maxDistance) {
        const angle = Math.atan2(deltaY, deltaX);
        deltaX = Math.cos(angle) * maxDistance;
        deltaY = Math.sin(angle) * maxDistance;
      }

      setPosition({ x: deltaX, y: deltaY });
      calculateVelocities(deltaX, deltaY);
    },
    [isDragging, calculateVelocities],
  );

  const handleStart = (clientX: number, clientY: number) => {
    setIsDragging(true);
    handleMove(clientX, clientY);
  };

  const handleEnd = () => {
    setIsDragging(false);
    setPosition({ x: 0, y: 0 });
    setLinearVelocity(0);
    setAngularVelocity(0);
  };

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
  }, [isDragging, handleMove]);

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div
        ref={joystickRef}
        className="relative touch-none select-none rounded-full bg-secondary p-4"
        style={{ width: baseSize, height: baseSize }}
        onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
        onTouchStart={(e) => {
          e.preventDefault();
          const touch = e.touches[0];
          handleStart(touch.clientX, touch.clientY);
        }}
      >
        <div
          ref={knobRef}
          className="absolute rounded-full bg-primary transition-transform"
          style={{
            width: knobSize,
            height: knobSize,
            left: `${(baseSize - knobSize) / 2}px`,
            top: `${(baseSize - knobSize) / 2}px`,
            transform: `translate(${position.x}px, ${position.y}px)`,
          }}
        />
      </div>
    </div>
  );
}
