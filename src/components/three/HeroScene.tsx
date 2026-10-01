"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Float, Lightformer, MeshTransmissionMaterial, RoundedBox } from "@react-three/drei";

type Kind = "torus" | "box" | "sphere" | "cone" | "knot" | "capsule" | "ico";

type ShapeDef = {
  kind: Kind;
  color: string;
  // pozycja jako ułamek połowy szerokości/wysokości widoku
  fx: number;
  fy: number;
  z: number;
  scale: number;
  glass?: boolean;
  delay: number;
};

const desktop: ShapeDef[] = [
  { kind: "torus", color: "#ff7262", fx: -0.74, fy: 0.42, z: -0.5, scale: 0.8, delay: 0 },
  { kind: "box", color: "#a259ff", fx: 0.78, fy: 0.5, z: -0.8, scale: 1, delay: 0.1 },
  { kind: "sphere", color: "#1abcfe", fx: 0.7, fy: -0.5, z: 0.2, scale: 0.62, delay: 0.2 },
  { kind: "cone", color: "#0acf83", fx: -0.68, fy: -0.52, z: 0.4, scale: 0.72, delay: 0.3 },
  { kind: "knot", color: "#ffffff", fx: 0.5, fy: 0.08, z: -2.6, scale: 0.85, glass: true, delay: 0.15 },
  { kind: "capsule", color: "#ffcd29", fx: -0.3, fy: 0.84, z: -2.2, scale: 0.42, delay: 0.25 },
  { kind: "ico", color: "#f24e1e", fx: 0.18, fy: -0.86, z: -1.6, scale: 0.4, delay: 0.35 },
];

const mobile: ShapeDef[] = [
  { kind: "torus", color: "#ff7262", fx: -0.62, fy: 0.62, z: -0.5, scale: 0.7, delay: 0 },
  { kind: "box", color: "#a259ff", fx: 0.7, fy: 0.72, z: -1, scale: 0.8, delay: 0.1 },
  { kind: "sphere", color: "#1abcfe", fx: 0.72, fy: -0.74, z: 0, scale: 0.55, delay: 0.2 },
  { kind: "cone", color: "#0acf83", fx: -0.66, fy: -0.78, z: 0.3, scale: 0.6, delay: 0.3 },
  { kind: "capsule", color: "#ffcd29", fx: 0.05, fy: 0.9, z: -2.5, scale: 0.35, delay: 0.25 },
];

function Geometry({ kind }: { kind: Kind }) {
  switch (kind) {
    case "torus":
      return <torusGeometry args={[0.6, 0.26, 48, 96]} />;
    case "sphere":
      return <sphereGeometry args={[0.7, 64, 64]} />;
    case "cone":
      return <coneGeometry args={[0.6, 1.1, 64]} />;
    case "knot":
      return <torusKnotGeometry args={[0.6, 0.22, 200, 32]} />;
    case "capsule":
      return <capsuleGeometry args={[0.35, 0.7, 16, 32]} />;
    case "ico":
      return <icosahedronGeometry args={[0.7, 0]} />;
    default:
      return null;
  }
}

function Material({ def, lowPower }: { def: ShapeDef; lowPower: boolean }) {
  return (
    <>
      {def.glass && !lowPower ? (
        <MeshTransmissionMaterial
          samples={6}
          resolution={512}
          thickness={0.6}
          roughness={0.05}
          chromaticAberration={0.25}
          anisotropicBlur={0.1}
          distortion={0.2}
          distortionScale={0.4}
          temporalDistortion={0.1}
          ior={1.4}
          backside
          color="#ffffff"
        />
      ) : (
        <meshPhysicalMaterial
          color={def.color}
          roughness={def.glass ? 0.05 : 0.18}
          metalness={0.05}
          clearcoat={1}
          clearcoatRoughness={0.08}
          transmission={def.glass ? 1 : 0}
          thickness={def.glass ? 0.5 : 0}
        />
      )}
    </>
  );
}

function Shape({ def, ready, pointer, lowPower }: { def: ShapeDef; ready: boolean; pointer: React.RefObject<THREE.Vector2>; lowPower: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const { viewport } = useThree();
  const start = useRef<number | null>(null);
  const fit = THREE.MathUtils.clamp(viewport.width / 9, 0.55, 1.15);
  const spin = useMemo(() => new THREE.Vector3(0.12 + (def.fx + 1) * 0.1, 0.12 + (def.fy + 1) * 0.1, 0), [def.fx, def.fy]);

  useFrame((state, dt) => {
    const g = ref.current;
    if (!g) return;
    if (ready && start.current === null) start.current = state.clock.elapsedTime;
    const t = start.current === null ? 0 : state.clock.elapsedTime - start.current - def.delay;
    const target = t > 0 ? def.scale * fit : 0;
    g.scale.setScalar(THREE.MathUtils.damp(g.scale.x, target, 4, dt));

    const depth = 1 / (1.5 - def.z * 0.3);
    const px = (def.fx * viewport.width) / 2 + pointer.current.x * 0.35 * depth;
    const py = (def.fy * viewport.height) / 2 + pointer.current.y * 0.25 * depth;
    g.position.x = THREE.MathUtils.damp(g.position.x, px, 3, dt);
    g.position.y = THREE.MathUtils.damp(g.position.y, py, 3, dt);
    g.rotation.x += spin.x * dt;
    g.rotation.y += spin.y * dt;
  });

  return (
    <group ref={ref} position={[(def.fx * viewport.width) / 2, (def.fy * viewport.height) / 2, def.z]} scale={0}>
      <Float speed={1.6} rotationIntensity={0.6} floatIntensity={0.8}>
        {def.kind === "box" ? (
          <RoundedBox args={[1.1, 1.1, 1.1]} radius={0.22} smoothness={6}>
            <Material def={def} lowPower={lowPower} />
          </RoundedBox>
        ) : (
          <mesh>
            <Geometry kind={def.kind} />
            <Material def={def} lowPower={lowPower} />
          </mesh>
        )}
      </Float>
    </group>
  );
}

function Rig({ children }: { children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    // Przy przewijaniu kształty odlatują w górę i obracają się.
    const p = Math.min(window.scrollY / window.innerHeight, 1.5);
    g.position.y = THREE.MathUtils.damp(g.position.y, p * 2.2, 6, dt);
    g.rotation.z = THREE.MathUtils.damp(g.rotation.z, p * 0.25, 6, dt);
    g.position.z = THREE.MathUtils.damp(g.position.z, p * 1.5, 6, dt);
  });
  return <group ref={ref}>{children}</group>;
}

export default function HeroScene({ ready, active }: { ready: boolean; active: boolean }) {
  const pointer = useRef(new THREE.Vector2());
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const shapes = isMobile ? mobile : desktop;

  useEffect(() => {
    const move = (e: PointerEvent) => {
      pointer.current.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, []);

  return (
    <Canvas
      dpr={[1, isMobile ? 1.5 : 1.75]}
      frameloop={active ? "always" : "never"}
      camera={{ position: [0, 0, 8], fov: 35 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
    >
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} />
      <Rig>
        {shapes.map((s, i) => (
          <Shape key={i} def={s} ready={ready} pointer={pointer} lowPower={isMobile} />
        ))}
      </Rig>
      <Environment resolution={256}>
        <group rotation={[-Math.PI / 3, 0, 1]}>
          <Lightformer form="circle" intensity={4} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={2} />
          <Lightformer form="circle" intensity={2} rotation-y={Math.PI / 2} position={[-5, 1, -1]} scale={2} />
          <Lightformer form="circle" intensity={2} rotation-y={Math.PI / 2} position={[-5, -1, -1]} scale={2} />
          <Lightformer form="circle" intensity={2} rotation-y={-Math.PI / 2} position={[10, 1, 0]} scale={8} />
          <Lightformer form="ring" color="#1abcfe" intensity={6} onUpdate={(self) => self.lookAt(0, 0, 0)} position={[10, 10, 0]} scale={10} />
        </group>
      </Environment>
    </Canvas>
  );
}
