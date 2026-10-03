"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, MeshTransmissionMaterial } from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";

/*
 * Szklany monogram "af." wytłoczony z geometrii logo (src/lib/logo.ts).
 * Za nim linie (line-art) i wędrująca wiązka światła — szkło je załamuje.
 * Układ SVG (y w dół) → 3D: X = x − 22, Y = 25 − y.
 *
 * Wydajność (żeby nikomu nie „muliło”):
 * - scena rysuje się tylko, gdy jest na ekranie (poza nim frameloop „never”), a za ekranem ładowania — jedną klatkę
 *   (rozgrzanie shaderów), bez 60 kl./s pod zasłoną,
 * - jakość dopasowuje się do sprzętu: poziomy 0–2 (gęstość pikseli, rozdzielczość i próbki szkła), licznik klatek
 *   obniża poziom, gdy komputer nie nadąża; programowy WebGL (brak GPU) i „ogranicz ruch” → jedna nieruchoma klatka,
 * - wynik zapamiętany na czas sesji (powrót na stronę główną startuje od razu z dobrym poziomem).
 */

type Tier = 0 | 1 | 2;
type Quality = { tier: Tier; still: boolean };
const LEVELS = [
  { dpr: 1.5, res: 1024, samples: 8, backside: true },
  { dpr: 1, res: 512, samples: 5, backside: true },
  { dpr: 0.8, res: 384, samples: 3, backside: false },
] as const;
const KEY = "afto:gl";

// programowy WebGL (SwiftShader, llvmpipe…) — GPU zablokowane albo brak; każda klatka to setki ms na procesorze
let software: boolean | null = null;
function isSoftware() {
  if (software !== null) return software;
  software = false;
  try {
    const c = document.createElement("canvas");
    const gl = (c.getContext("webgl2", { failIfMajorPerformanceCaveat: true }) ?? c.getContext("webgl", { failIfMajorPerformanceCaveat: true })) as WebGLRenderingContext | null;
    if (!gl) software = true;
    else {
      const info = gl.getExtension("WEBGL_debug_renderer_info");
      const name = String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER));
      software = /swiftshader|llvmpipe|softpipe|software|basic render/i.test(name);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    }
  } catch {}
  return software;
}

function initialQuality(): Quality {
  try {
    const saved = JSON.parse(sessionStorage.getItem(KEY) ?? "null") as Quality | null;
    if (saved && [0, 1, 2].includes(saved.tier)) return saved;
  } catch {}
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (isSoftware()) return { tier: 1, still: true };
  const nav = navigator as Navigator & { deviceMemory?: number };
  const weak = (navigator.hardwareConcurrency || 8) <= 4 || (nav.deviceMemory ?? 8) <= 4;
  return { tier: weak ? 1 : 0, still: reduce };
}

// częstotliwość odświeżania (mediana odstępów klatek) — próg „nie nadąża” zależy od ekranu (60/120 Hz, tryb oszczędzania 30 Hz)
function useRefreshRate() {
  const hz = useRef(60);
  useEffect(() => {
    const d: number[] = [];
    let last = 0;
    let id = 0;
    const f = (t: number) => {
      if (last) d.push(t - last);
      last = t;
      if (d.length < 40) id = requestAnimationFrame(f);
      else {
        d.sort((a, b) => a - b);
        hz.current = Math.min(240, Math.max(24, 1000 / d[d.length >> 1]));
      }
    };
    id = requestAnimationFrame(f);
    return () => cancelAnimationFrame(id);
  }, []);
  return hz;
}

// Licznik klatek (okna 1 s): 2 okna z rzędu za wolno → niższy poziom; na najniższym 3 okna poniżej połowy odświeżania
// → nieruchoma klatka; 2 okna dramatycznie wolno (<15 kl./s, np. bardzo słabe GPU) → od razu najniższy poziom
function Governor({ quality, onChange, hz }: { quality: Quality; onChange: (q: Quality) => void; hz: React.RefObject<number> }) {
  const s = useRef({ warm: 0, t: 0, n: 0, bad: 0, severe: 0 });
  useEffect(() => {
    s.current = { warm: 0, t: 0, n: 0, bad: 0, severe: 0 };
  }, [quality]);
  useFrame((_, dt) => {
    const a = s.current;
    if (quality.still || dt > 1) return;
    // pierwsze klatki po starcie/zmianie poziomu to kompilacja shaderów — nie liczą się
    if ((a.warm += dt) < 1.2) return;
    a.t += dt;
    a.n++;
    if (a.t < 1) return;
    const fps = a.n / a.t;
    a.t = a.n = 0;
    const lowest = quality.tier === 2;
    // (próg nie rośnie ponad 51/30 kl./s — na ekranach 120 Hz 90 kl./s to nadal płynnie)
    const limit = lowest ? Math.min(30, hz.current * 0.5) : Math.min(51, hz.current * 0.85);
    a.severe = fps < Math.min(15, hz.current * 0.4) ? a.severe + 1 : 0;
    a.bad = fps < limit ? a.bad + 1 : 0;
    if (lowest && (a.severe >= 2 || a.bad >= 3)) onChange({ tier: 1, still: true });
    else if (!lowest && a.severe >= 2) onChange({ tier: 2, still: false });
    else if (!lowest && a.bad >= 2) onChange({ tier: (quality.tier + 1) as Tier, still: false });
  });
  return null;
}


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

function Backdrop({ center = false, at }: { center?: boolean; at?: number }) {
  const beam = useRef<THREE.Mesh>(null);
  const time = useSafeTime();
  const { lines, glow, beamTex, cx } = useMemo(() => {
    // linie wygaszane z dala od monogramu (jasność koloru = widoczność na czarnym tle)
    const pts: number[] = [];
    const cols: number[] = [];
    const cx = at ?? (!center && typeof window !== "undefined" && window.innerWidth / window.innerHeight > 1.15 ? 26 : 0);
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
  }, [center, at]);

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

function Monogram({ ready, mobile, center = false, at, quality, moving }: { ready: boolean; mobile: boolean; center?: boolean; at?: number; quality: Quality; moving: boolean }) {
  const group = useRef<THREE.Group>(null);
  const { size } = useThree();
  const pointer = useRef(new THREE.Vector2());
  const intro = useRef(0);
  const time = useSafeTime();
  // „puls” (np. po poprawnym kodzie): obrót o 360° i rozbłysk kropki
  const spin = useRef(0);
  const boost = useRef(0);
  useEffect(() => {
    const on = () => {
      spin.current += Math.PI * 2;
      boost.current = 1;
    };
    window.addEventListener("afto:pulse", on);
    return () => window.removeEventListener("afto:pulse", on);
  }, []);

  // kropka ze szkła jak reszta znaku (jedna geometria = jeden przebieg szkła)
  const { body } = useMemo(() => {
    const s = logoShapes();
    const body = new THREE.ExtrudeGeometry([...s.body, s.dot], extrude);
    body.translate(0, 0, -2.5);
    return { body };
  }, []);

  useEffect(() => {
    const move = (e: PointerEvent) => pointer.current.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, []);

  const wide = size.width / size.height > 1.15;
  const level = LEVELS[quality.tier];
  const bg = useMemo(() => new THREE.Color("#07070a"), []);

  useFrame((_, rawDt) => {
    const g = group.current;
    if (!g) return;
    const dt = Math.min(rawDt, 1 / 30);
    // nieruchoma klatka: od razu docelowe ułożenie (bez wejścia i wygładzania)
    if (!moving) intro.current = 1;
    else if (ready) intro.current = Math.min(1, intro.current + dt / 2.4);
    const e = 1 - Math.pow(1 - intro.current, 4);
    const t = time.current;

    boost.current = Math.max(0, boost.current - dt * 1.4);
    const ry = Math.sin(t * 0.3) * 0.42 + pointer.current.x * 0.35 - (1 - e) * 1.2 + spin.current;
    const rx = -pointer.current.y * 0.15 + Math.sin(t * 0.45) * 0.05;
    g.rotation.y = moving ? THREE.MathUtils.damp(g.rotation.y, ry, 2.5, dt) : ry;
    g.rotation.x = moving ? THREE.MathUtils.damp(g.rotation.x, rx, 2.5, dt) : rx;
    if (at !== undefined) {
      // w ramce (kokpit panelu): cały znak widoczny, z prawej strony karty
      g.position.set(at, 2 + Math.sin(t * 0.7) * 0.7, 0);
      g.scale.setScalar(0.74 * (0.75 + 0.25 * e) * (1 + boost.current * 0.12));
    } else if (center) {
      g.position.set(0, (wide ? 1 : 6) + Math.sin(t * 0.7) * 0.7, 0);
      g.scale.setScalar((wide ? 1.35 : 0.85) * (0.75 + 0.25 * e) * (1 + boost.current * 0.12));
    } else {
      g.position.set(wide ? Math.min(26, (size.width / size.height) * 11) : 0, (wide ? 3 : 22) + Math.sin(t * 0.7) * 0.7, 0);
      g.scale.setScalar((wide ? 0.95 : 0.7) * (0.75 + 0.25 * e));
    }
  });

  return (
    <group ref={group}>
      <mesh geometry={body}>
        <MeshTransmissionMaterial
          samples={quality.tier === 0 && mobile ? 4 : level.samples}
          resolution={quality.tier === 0 && mobile ? 512 : level.res}
          thickness={6}
          roughness={0.04}
          ior={1.45}
          chromaticAberration={0.08}
          anisotropy={0.2}
          distortion={0.08}
          distortionScale={0.4}
          temporalDistortion={0.05}
          backside={level.backside}
          backsideThickness={2}
          color="#ffffff"
          background={bg}
        />
      </mesh>

    </group>
  );
}

export default function LogoScene({ ready, active, center = false, at }: { ready: boolean; active: boolean; center?: boolean; at?: number }) {
  const [mobile] = useState(() => window.innerWidth < 768);
  const [quality, setQuality] = useState(initialQuality);
  const hz = useRefreshRate();
  // „puls” w trybie nieruchomej klatki: na chwilę włącz animację, żeby obrót było widać
  const [burst, setBurst] = useState(false);
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const on = () => {
      setBurst(true);
      clearTimeout(t);
      t = setTimeout(() => setBurst(false), 2600);
    };
    window.addEventListener("afto:pulse", on);
    return () => {
      clearTimeout(t);
      window.removeEventListener("afto:pulse", on);
    };
  }, []);
  const lower = (q: Quality) => {
    setQuality(q);
    try {
      sessionStorage.setItem(KEY, JSON.stringify(q));
    } catch {}
  };

  const moving = !quality.still || burst;
  // poza ekranem — nic; za ekranem ładowania albo jako nieruchoma klatka — tylko na żądanie (pierwsza klatka kompiluje shadery)
  const frameloop = !active ? "never" : moving && ready ? "always" : "demand";
  const dpr = Math.min(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1, LEVELS[quality.tier].dpr);

  return (
    // antialias wyłączony: obraz i tak przechodzi przez EffectComposer (bez MSAA), więc wygładzanie płótna tylko kosztowało
    <Canvas dpr={dpr} frameloop={frameloop} camera={{ position: [0, 0, 95], fov: 30 }} gl={{ antialias: false, powerPreference: "high-performance" }}>
      <color attach="background" args={["#07070a"]} />
      <Backdrop center={center} at={at} />
      <Monogram ready={ready} mobile={mobile} center={center} at={at} quality={quality} moving={moving} />
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={4} color="#ffffff" position={[25, 30, 30]} scale={[30, 4, 1]} onUpdate={(s) => s.lookAt(0, 0, 0)} />
        <Lightformer form="rect" intensity={3} color="#ffffff" position={[-35, 0, 20]} scale={[6, 60, 1]} onUpdate={(s) => s.lookAt(0, 0, 0)} />
        <Lightformer form="rect" intensity={2} color="#ffffff" position={[0, -30, 25]} scale={[50, 3, 1]} onUpdate={(s) => s.lookAt(0, 0, 0)} />
      </Environment>
      <EffectComposer multisampling={0}>
        <Bloom mipmapBlur intensity={0.8} luminanceThreshold={1} luminanceSmoothing={0.25} />
      </EffectComposer>
      {/* licznik startuje od zera przy każdym powrocie sceny na ekran */}
      {ready && active && <Governor quality={quality} onChange={lower} hz={hz} />}
    </Canvas>
  );
}
