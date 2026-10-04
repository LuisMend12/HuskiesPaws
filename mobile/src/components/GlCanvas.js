// expo-gl Canvas that waits a beat after the map has been taken down, so the
// JS thread can finish a tap and MapLibre can release the GPU before three.js
// asks for another GL context (two at once freezes the phone).
import "./threePolyfill.js";
import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber/native";

export function GlCanvas({ children, delayMs = 80, ...props }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setReady(true), delayMs);
    return () => clearTimeout(timer);
  }, [delayMs]);
  if (!ready) return null;
  return (
    <Canvas dpr={1} frameloop="demand" {...props}>
      {children}
    </Canvas>
  );
}
