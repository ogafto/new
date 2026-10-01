"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Grid, Lightformer } from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";

/*
 * Monogram "af." wytłoczony z dokładnej geometrii logo (src/lib/logo.ts).
 * Układ SVG (y w dół) → świat 3D: X = x − 22, Y = 25 − y. Grubość linii logo = 5.
 */

const VIOLET = new THREE.Color("#8b6cff");

function shapes() {
  // pierścień "a" — środek (16,31), r 9 ± 2.5
  const ring = new THREE.Shape();
  ring.absarc(-6, -6, 11.5, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absarc(-6, -6, 6.5, 0, Math.PI * 2, true);
  ring.holes.push(hole);

  // trzon "f" z łukiem — obrys linii o szerokości 5
  const stem = new THREE.Shape();
  stem.moveTo(0.5, -17.5);
  stem.lineTo(0.5, 8);
  stem.absarc(10, 8, 9.5, Math.PI, Math.PI / 2, true);
  stem.lineTo(17.5, 17.5);
  stem.lineTo(17.5, 12.5);
  stem.lineTo(10, 12.5);
  stem.absarc(10, 8, 4.5, Math.PI / 2, Math.PI, false);
  stem.lineTo(5.5, -17.5);
  stem.closePath();

  // poprzeczka "f"
  const bar = new THREE.Shape();
  bar.moveTo(3, -1.5);
  bar.lineTo(12.5, -1.5);
  bar.lineTo(12.5, 3.5);
  bar.lineTo(3, 3.5);
  bar.closePath();

  // kropka
  const dot = new THREE.Shape();
  dot.moveTo(12.5, -17.5);
  dot.lineTo(17.5, -17.5);
  dot.lineTo(17.5, -12.5);
  dot.lineTo(12.5, -12.5);
  dot.closePath();

  return { body: [ring, stem, bar], dot };
}

const extrude = { depth: 4, bevelEnabled: true, bevelThickness: 0.7, bevelSize: 0.55, bevelSegments: 6, curveSegments: 64 };

function Monogram({ ready }: { ready: boolean }) {
  const group = useRef<THREE.Group>(null);
  const { size } = useThree();
  const pointer = useRef(new THREE.Vector2());
  const start = useRef<number | null>(null);

  const { bodyGeo, dotGeo, edges } = useMemo(() => {
    const s = shapes();
    const bodyGeo = new THREE.ExtrudeGeometry(s.body, extrude);
    bodyGeo.translate(0, 0, -2);
    const dotGeo = new THREE.ExtrudeGeometry(s.dot, extrude);
    dotGeo.translate(0, 0, -2);
    // krawędzie bryły jako linie — line-art w 3D
    const edges = new THREE.EdgesGeometry(bodyGeo, 30);
    return { bodyGeo, dotGeo, edges };
  }, []);

  useEffect(() => {
    const move = (e: PointerEvent) => pointer.current.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, []);

  const wide = size.width / size.height > 1.15;

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    if (ready && start.current === null) start.current = state.clock.elapsedTime;
    const t = start.current === null ? 0 : state.clock.elapsedTime - start.current;
    const intro = Math.min(1, t / 2.2);
    const e = 1 - Math.pow(1 - intro, 4);
    const time = state.clock.elapsedTime;

    const targetY = Math.sin(time * 0.35) * 0.35 + pointer.current.x * 0.45 + (1 - e) * -1.6;
    const targetX = -pointer.current.y * 0.18 + Math.sin(time * 0.5) * 0.04;
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, targetY, 3, dt);
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, targetX, 3, dt);
    g.position.y = (wide ? 6 : 12) + Math.sin(time * 0.8) * 0.8;
    g.position.x = wide ? Math.min(28, (size.width / size.height) * 12) : 0;
    g.scale.setScalar((wide ? 0.78 : 0.62) * (0.6 + 0.4 * e));
  });

  return (
    <group ref={group}>
      <mesh geometry={bodyGeo}>
        <meshPhysicalMaterial color="#2c2a38" metalness={0.75} roughness={0.32} clearcoat={1} clearcoatRoughness={0.15} envMapIntensity={1.6} />
      </mesh>
      <lineSegments geometry={edges}>
        <lineBasicMaterial color="#cfc4ff" transparent opacity={0.35} />
      </lineSegments>
      <mesh geometry={dotGeo}>
        <meshStandardMaterial color={VIOLET} emissive={VIOLET} emissiveIntensity={2.2} toneMapped={false} />
      </mesh>
      <pointLight position={[15, -15, 8]} color="#8b6cff" intensity={600} distance={60} />
      <Orbits />
    </group>
  );
}

// Liniowe orbity z punktami światła
function Orbits() {
  const ref = useRef<THREE.Group>(null);
  const rings = useMemo(
    () => [
      { r: 29, tilt: [1.2, 0.2, 0], speed: 0.12, color: "#8b6cff", opacity: 0.75, light: 2.4 },
      { r: 34, tilt: [1.45, -0.5, 0.3], speed: -0.08, color: "#ffffff", opacity: 0.12, light: 0 },
      { r: 24, tilt: [0.5, 0.9, 0], speed: 0.16, color: "#b4a2ff", opacity: 0.3, light: 1.6 },
    ],
    [],
  );
  const dots = useRef<(THREE.Mesh | null)[]>([]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    rings.forEach((r, i) => {
      const d = dots.current[i];
      if (d) {
        const a = t * r.speed * 4 + i * 2;
        d.position.set(Math.cos(a) * r.r, Math.sin(a) * r.r, 0);
      }
    });
    if (ref.current) ref.current.rotation.z = t * 0.03;
  });

  return (
    <group ref={ref}>
      {rings.map((r, i) => (
        <group key={i} rotation={r.tilt as [number, number, number]}>
          <mesh>
            <torusGeometry args={[r.r, 0.06, 8, 256]} />
            <meshBasicMaterial color={r.color} transparent opacity={r.opacity} toneMapped={r.light === 0} />
          </mesh>
          {r.light > 0 && (
            <mesh ref={(m) => void (dots.current[i] = m)}>
              <sphereGeometry args={[0.45, 16, 16]} />
              <meshBasicMaterial color={new THREE.Color(r.color).multiplyScalar(r.light)} toneMapped={false} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}

export default function LogoScene({ ready, active }: { ready: boolean; active: boolean }) {
  const mobile = typeof window !== "undefined" && window.innerWidth < 768;
  return (
    <Canvas
      dpr={[1, mobile ? 1.5 : 2]}
      frameloop={active ? "always" : "never"}
      camera={{ position: [0, 4, 92], fov: 32 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
    >
      <color attach="background" args={["#07070a"]} />
      <ambientLight intensity={0.25} />
      <directionalLight position={[-20, 30, 40]} intensity={1.4} color="#ffffff" />
      <directionalLight position={[40, -10, 20]} intensity={1.2} color="#8b6cff" />
      <fog attach="fog" args={["#07070a", 90, 190]} />
      <Monogram ready={ready} />
      <Grid
        position={[0, -30, 0]}
        args={[400, 400]}
        cellSize={6}
        cellThickness={0.6}
        cellColor="#1d1b26"
        sectionSize={30}
        sectionThickness={1}
        sectionColor="#3a2f6b"
        fadeDistance={190}
        fadeStrength={1.6}
        infiniteGrid
      />
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={6} color="#8b6cff" position={[-30, 10, 20]} scale={[10, 40, 1]} onUpdate={(s) => s.lookAt(0, 0, 0)} />
        <Lightformer form="rect" intensity={4} color="#ffffff" position={[30, 25, 25]} scale={[20, 6, 1]} onUpdate={(s) => s.lookAt(0, 0, 0)} />
        <Lightformer form="ring" intensity={3} color="#b4a2ff" position={[0, -20, 30]} scale={18} onUpdate={(s) => s.lookAt(0, 0, 0)} />
        <Lightformer form="rect" intensity={2} color="#4b3aa8" position={[0, 40, -30]} scale={[60, 10, 1]} onUpdate={(s) => s.lookAt(0, 0, 0)} />
      </Environment>
      <EffectComposer multisampling={0}>
        <Bloom mipmapBlur intensity={1.1} luminanceThreshold={1} luminanceSmoothing={0.2} />
      </EffectComposer>
    </Canvas>
  );
}
