"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, MeshTransmissionMaterial } from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";

/*
 * Szklany monogram "af." wytłoczony z geometrii logo (src/lib/logo.ts).
 * Za nim linie (line-art) i wędrująca wiązka światła — szkło je załamuje.
 * Układ SVG (y w dół) → 3D: X = x − 22, Y = 25 − y.
 */

const VIOLET = new THREE.Color("#8b6cff");

function logoShapes() {
  const ring = new THREE.Shape();
  ring.absarc(-6, -6, 11.5, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absarc(-6, -6, 6.5, 0, Math.PI * 2, true);
  ring.holes.push(hole);

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

  const bar = new THREE.Shape();
  bar.moveTo(3, -1.5);
  bar.lineTo(12.5, -1.5);
  bar.lineTo(12.5, 3.5);
  bar.lineTo(3, 3.5);
  bar.closePath();

  const dot = new THREE.Shape();
  dot.moveTo(12.5, -17.5);
  dot.lineTo(17.5, -17.5);
  dot.lineTo(17.5, -12.5);
  dot.lineTo(12.5, -12.5);
  dot.closePath();

  return { body: [ring, stem, bar], dot };
}

const extrude = { depth: 5, bevelEnabled: true, bevelThickness: 1.1, bevelSize: 0.9, bevelSegments: 8, curveSegments: 72 };

// Zegar z ograniczonym krokiem — po pauzie (sekcja poza ekranem) nic nie skacze
function useSafeTime() {
  const t = useRef(0);
  useFrame((_, dt) => {
    t.current += Math.min(dt, 1 / 30);
  });
  return t;
}

function Backdrop() {
  const beam = useRef<THREE.Mesh>(null);
  const time = useSafeTime();
  const { lines, glow, beamTex, cx } = useMemo(() => {
    // linie wygaszane z dala od monogramu (jasność koloru = widoczność na czarnym tle)
    const pts: number[] = [];
    const cols: number[] = [];
    const cx = typeof window !== "undefined" && window.innerWidth / window.innerHeight > 1.15 ? 26 : 0;
    for (let x = -150; x <= 150; x += 4) {
      const k = 0.13 * Math.exp(-Math.pow((x - cx) / 38, 2));
      for (const y of [-60, 60]) {
        pts.push(x, y, 0);
        cols.push(k * 0.85, k * 0.8, k);
      }
    }
    const lines = new THREE.BufferGeometry();
    lines.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    lines.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
    // miękka poświata z gradientu radialnego
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, "rgba(139,108,255,0.1)");
    g.addColorStop(0.5, "rgba(90,60,200,0.06)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    const glow = new THREE.CanvasTexture(c);
    // wiązka: miękki pionowy pasek wygaszany na końcach
    const b = document.createElement("canvas");
    b.width = 32;
    b.height = 256;
    const bx = b.getContext("2d")!;
    const gy = bx.createLinearGradient(0, 0, 0, 256);
    gy.addColorStop(0, "rgba(255,255,255,0)");
    gy.addColorStop(0.5, "rgba(255,255,255,1)");
    gy.addColorStop(1, "rgba(255,255,255,0)");
    bx.fillStyle = gy;
    bx.fillRect(0, 0, 32, 256);
    bx.globalCompositeOperation = "destination-in";
    const gx = bx.createLinearGradient(0, 0, 32, 0);
    gx.addColorStop(0, "rgba(0,0,0,0)");
    gx.addColorStop(0.5, "rgba(0,0,0,1)");
    gx.addColorStop(1, "rgba(0,0,0,0)");
    bx.fillStyle = gx;
    bx.fillRect(0, 0, 32, 256);
    const beamTex = new THREE.CanvasTexture(b);
    return { lines, glow, beamTex, cx };
  }, []);

  useFrame(() => {
    if (beam.current) beam.current.position.x = cx - 32 + ((time.current * 9) % 64);
  });

  return (
    <group position={[0, 0, -30]}>
      <lineSegments geometry={lines}>
        <lineBasicMaterial vertexColors />
      </lineSegments>
      {/* wiązka światła przesuwająca się za szkłem */}
      <mesh ref={beam} position={[0, 0, 1]}>
        <planeGeometry args={[3, 70]} />
        <meshBasicMaterial map={beamTex} color={new THREE.Color("#c9bcff").multiplyScalar(1.1)} transparent depthWrite={false} toneMapped={false} />
      </mesh>
      {/* miękkie fioletowe światło */}
      <mesh position={[cx, 2, -2]}>
        <planeGeometry args={[130, 130]} />
        <meshBasicMaterial map={glow} transparent depthWrite={false} />
      </mesh>
    </group>
  );
}

function Monogram({ ready, mobile }: { ready: boolean; mobile: boolean }) {
  const group = useRef<THREE.Group>(null);
  const { size } = useThree();
  const pointer = useRef(new THREE.Vector2());
  const intro = useRef(0);
  const time = useSafeTime();

  const { body, dot } = useMemo(() => {
    const s = logoShapes();
    const body = new THREE.ExtrudeGeometry(s.body, extrude);
    body.translate(0, 0, -2.5);
    const dot = new THREE.ExtrudeGeometry(s.dot, extrude);
    dot.translate(0, 0, -2.5);
    return { body, dot };
  }, []);

  useEffect(() => {
    const move = (e: PointerEvent) => pointer.current.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, []);

  const wide = size.width / size.height > 1.15;

  useFrame((_, rawDt) => {
    const g = group.current;
    if (!g) return;
    const dt = Math.min(rawDt, 1 / 30);
    if (ready) intro.current = Math.min(1, intro.current + dt / 2.4);
    const e = 1 - Math.pow(1 - intro.current, 4);
    const t = time.current;

    const ry = Math.sin(t * 0.3) * 0.42 + pointer.current.x * 0.35 - (1 - e) * 1.2;
    const rx = -pointer.current.y * 0.15 + Math.sin(t * 0.45) * 0.05;
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, ry, 2.5, dt);
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, rx, 2.5, dt);
    g.position.set(wide ? Math.min(26, (size.width / size.height) * 11) : 0, (wide ? 3 : 22) + Math.sin(t * 0.7) * 0.7, 0);
    g.scale.setScalar((wide ? 0.95 : 0.7) * (0.75 + 0.25 * e));
  });

  return (
    <group ref={group}>
      <mesh geometry={body}>
        <MeshTransmissionMaterial
          samples={mobile ? 4 : 8}
          resolution={mobile ? 512 : 1024}
          thickness={6}
          roughness={0.04}
          ior={1.45}
          chromaticAberration={0.08}
          anisotropy={0.2}
          distortion={0.08}
          distortionScale={0.4}
          temporalDistortion={0.05}
          backside
          backsideThickness={2}
          color="#ffffff"
          background={new THREE.Color("#07070a")}
        />
      </mesh>
      <mesh geometry={dot}>
        <meshStandardMaterial color={VIOLET} emissive={VIOLET} emissiveIntensity={1.8} toneMapped={false} />
      </mesh>
    </group>
  );
}

export default function LogoScene({ ready, active }: { ready: boolean; active: boolean }) {
  const mobile = typeof window !== "undefined" && window.innerWidth < 768;
  return (
    <Canvas dpr={[1, mobile ? 1.5 : 2]} frameloop={active ? "always" : "demand"} camera={{ position: [0, 0, 95], fov: 30 }} gl={{ antialias: true, powerPreference: "high-performance" }}>
      <color attach="background" args={["#07070a"]} />
      <Backdrop />
      <Monogram ready={ready} mobile={mobile} />
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={4} color="#ffffff" position={[25, 30, 30]} scale={[30, 4, 1]} onUpdate={(s) => s.lookAt(0, 0, 0)} />
        <Lightformer form="rect" intensity={3} color="#ffffff" position={[-35, 0, 20]} scale={[6, 60, 1]} onUpdate={(s) => s.lookAt(0, 0, 0)} />
        <Lightformer form="rect" intensity={2} color="#ffffff" position={[0, -30, 25]} scale={[50, 3, 1]} onUpdate={(s) => s.lookAt(0, 0, 0)} />
      </Environment>
      <EffectComposer multisampling={0}>
        <Bloom mipmapBlur intensity={0.8} luminanceThreshold={1} luminanceSmoothing={0.25} />
      </EffectComposer>
    </Canvas>
  );
}
