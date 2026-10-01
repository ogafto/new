"use client";

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { animate } from "motion/react";
import { useLenis } from "lenis/react";
import Snap from "lenis/snap";
import { boundsView, easeInOut, frameView, interpolateZoom, viewToTransform, type View } from "@/lib/camera";
import { frames, worldBounds } from "@/lib/frames";
import { useLoaded } from "../Providers";

export type Mode = "pending" | "canvas" | "flow";
type Tilt = { rx: number; rz: number; ex: number };

type Ctx = {
  mode: Mode;
  active: number;
  zoom: number;
  overview: boolean;
  threeD: boolean;
  revealed: boolean;
  width: number;
  spacer: number;
  commentOpen: boolean;
  prefill: string;
  setCommentOpen: (v: boolean) => void;
  setPrefill: (v: string) => void;
  goTo: (i: number) => void;
  goToId: (id: string) => void;
  toggleOverview: () => void;
  worldRef: React.RefObject<HTMLDivElement | null>;
  tiltRef: React.RefObject<HTMLDivElement | null>;
  bgRef: React.RefObject<HTMLDivElement | null>;
};

const CanvasContext = createContext<Ctx | null>(null);
export const useCanvas = () => {
  const c = useContext(CanvasContext);
  if (!c) throw new Error("useCanvas poza CanvasProvider");
  return c;
};

const HOLD = 0.32; // część odcinka przewijania, w której kamera stoi na ramce
const FLAT: Tilt = { rx: 0, rz: 0, ex: 0 };
const EXPLODED: Tilt = { rx: 48, rz: -22, ex: 1 };

export default function CanvasProvider({ children }: { children: React.ReactNode }) {
  const loaded = useLoaded();
  const lenis = useLenis();
  const [mode, setMode] = useState<Mode>("pending");
  const [size, setSize] = useState({ W: 1440, H: 900 });
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [overview, setOverview] = useState(false);
  const [threeD, setThreeD] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [commentOpen, setCommentOpen] = useState(false);
  const [prefill, setPrefill] = useState("");

  const world = useRef<HTMLDivElement>(null);
  const tilt = useRef<HTMLDivElement>(null);
  const bg = useRef<HTMLDivElement>(null);
  const view = useRef<View>([0, 0, 1440]);
  const tiltState = useRef<Tilt>(FLAT);
  const flying = useRef(false);
  const overviewRef = useRef(false);
  const activeRef = useRef(0);
  const anim = useRef<ReturnType<typeof animate> | null>(null);

  // Tryb: płótno na dużych ekranach, klasyczny scroll na telefonach / przy ograniczonym ruchu.
  useLayoutEffect(() => {
    const decide = () => {
      const W = window.innerWidth;
      const H = window.innerHeight;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      setSize({ W, H });
      setMode(W >= 1024 && H >= 600 && !reduce ? "canvas" : "flow");
    };
    decide();
    window.addEventListener("resize", decide);
    return () => window.removeEventListener("resize", decide);
  }, []);

  const S = Math.round(size.H * 0.95); // długość odcinka scrolla na jedną ramkę
  const stops = useMemo(() => frames.map((f) => frameView(f, size.W, size.H)), [size]);
  const paths = useMemo(() => stops.slice(0, -1).map((v, i) => interpolateZoom(v, stops[i + 1])), [stops]);
  const overviewView = useMemo(() => boundsView(worldBounds, size.W, size.H, 0.05), [size]);
  const spacer = (frames.length - 1) * S + size.H;

  const apply = useCallback(
    (v: View, t: Tilt = FLAT, moving = false) => {
      const w = world.current;
      if (!w) return;
      const { W, H } = size;
      const { s, tx, ty } = viewToTransform(v, W, H);
      view.current = v;
      tiltState.current = t;
      w.style.transform = `translate(${tx}px, ${ty}px) scale(${s})`;
      w.style.setProperty("--inv", `${1 / s}`);
      w.style.setProperty("--ez", `${t.ex}`);
      w.style.willChange = moving ? "transform" : "auto";
      if (tilt.current) tilt.current.style.transform = t.rx || t.rz ? `rotateX(${t.rx}deg) rotateZ(${t.rz}deg)` : "none";
      if (bg.current) {
        const g = 24 * s;
        bg.current.style.backgroundSize = `${g}px ${g}px`;
        bg.current.style.backgroundPosition = `${tx}px ${ty}px`;
        bg.current.style.opacity = `${Math.max(0, Math.min(1, (s - 0.25) * 3)) * (1 - t.ex)}`;
      }
      const z = Math.round(s * 100);
      setZoom((p) => (p === z ? p : z));
    },
    [size],
  );

  const fromScroll = useCallback(
    (y: number) => {
      const n = stops.length;
      const k = Math.floor(y / S);
      if (k >= n - 1) return { v: stops[n - 1], i: n - 1, t: FLAT, moving: false };
      if (k < 0) return { v: stops[0], i: 0, t: FLAT, moving: false };
      const local = (y - k * S) / S;
      if (local <= HOLD) return { v: stops[k], i: k, t: FLAT, moving: false };
      const u = easeInOut((local - HOLD) / (1 - HOLD));
      // lekkie "uniesienie" kamery w trakcie przelotu
      return { v: paths[k](u), i: u < 0.5 ? k : k + 1, t: { rx: Math.sin(Math.PI * u) * 7, rz: 0, ex: 0 }, moving: true };
    },
    [stops, paths, S],
  );

  const setActiveIdx = (i: number) => {
    activeRef.current = i;
    setActive((p) => (p === i ? p : i));
  };

  // Przewijanie steruje kamerą
  useLenis(
    (l) => {
      if (mode !== "canvas" || flying.current || overviewRef.current) return;
      const r = fromScroll(l.animatedScroll);
      apply(r.v, r.t, r.moving);
      setActiveIdx(r.i);
    },
    [mode, fromScroll, apply],
  );

  // Pozycja startowa po zmianie rozmiaru
  useLayoutEffect(() => {
    if (mode !== "canvas" || flying.current || overviewRef.current) return;
    const r = fromScroll(window.scrollY);
    apply(r.v, r.t, false);
  }, [mode, fromScroll, apply]);

  // Przyciąganie do ramek
  useEffect(() => {
    if (mode !== "canvas" || !lenis) return;
    const snap = new Snap(lenis, { type: "mandatory", debounce: 260, duration: 1.1, easing: easeInOut });
    frames.forEach((_, i) => snap.add(i * S));
    return () => snap.destroy();
  }, [mode, lenis, S]);

  const fly = useCallback(
    (to: View, toTilt: Tilt, opts: { duration?: number; onDone?: () => void } = {}) => {
      anim.current?.stop();
      flying.current = true;
      lenis?.stop();
      const from = view.current;
      const fromT = tiltState.current;
      const path = interpolateZoom(from, to);
      const duration = opts.duration ?? Math.min(2, Math.max(0.9, (path.duration / 1000) * 0.6));
      const lift = toTilt.ex === 0 && fromT.ex === 0 ? 6 : 0;
      if (toTilt.ex > 0 || fromT.ex > 0) setThreeD(true);
      anim.current = animate(0, 1, {
        duration,
        ease: [0.65, 0, 0.3, 1],
        onUpdate: (t) =>
          apply(
            path(t),
            {
              rx: fromT.rx + (toTilt.rx - fromT.rx) * t + Math.sin(Math.PI * t) * lift,
              rz: fromT.rz + (toTilt.rz - fromT.rz) * t,
              ex: fromT.ex + (toTilt.ex - fromT.ex) * t,
            },
            true,
          ),
        onComplete: () => {
          apply(to, toTilt, false);
          if (toTilt.ex === 0) setThreeD(false);
          opts.onDone?.();
        },
      });
    },
    [apply, lenis],
  );

  const goTo = useCallback(
    (i: number) => {
      const idx = Math.max(0, Math.min(frames.length - 1, i));
      if (mode !== "canvas") {
        lenis?.scrollTo(`#${frames[idx].id}`, { offset: -80, duration: 1.4 });
        return;
      }
      overviewRef.current = false;
      setOverview(false);
      setActiveIdx(idx);
      fly(stops[idx], FLAT, {
        onDone: () => {
          lenis?.start();
          lenis?.scrollTo(idx * S, { immediate: true, force: true });
          flying.current = false;
        },
      });
    },
    [mode, lenis, fly, stops, S],
  );

  const goToId = useCallback((id: string) => goTo(frames.findIndex((f) => f.id === id)), [goTo]);

  const toggleOverview = useCallback(() => {
    if (mode !== "canvas") return;
    if (overviewRef.current) return goTo(activeRef.current);
    overviewRef.current = true;
    setOverview(true);
    fly(overviewView, EXPLODED, { duration: 1.4 });
  }, [mode, goTo, fly, overviewView]);

  // Intro: plik otwiera się w widoku 3D "rozbitych warstw", potem kamera wlatuje do pierwszej ramki.
  useEffect(() => {
    if (!loaded || mode === "pending") return;
    const t0 = setTimeout(() => {
      setRevealed(true);
      if (mode === "canvas") setThreeD(true);
    }, 0);
    if (mode !== "canvas") return () => clearTimeout(t0);
    overviewRef.current = true;
    apply(overviewView, EXPLODED);
    lenis?.stop();
    const t1 = setTimeout(() => {
      overviewRef.current = false;
      setActiveIdx(0);
      fly(stops[0], FLAT, {
        duration: 2.3,
        onDone: () => {
          lenis?.start();
          lenis?.scrollTo(0, { immediate: true, force: true });
          flying.current = false;
        },
      });
    }, 1300);
    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
    };
    // intro tylko raz po załadowaniu
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, mode]);

  // Skróty klawiszowe jak w edytorze
  useEffect(() => {
    if (mode !== "canvas") return;
    const onKey = (e: KeyboardEvent) => {
      const el = e.target instanceof Element ? e.target : null;
      if (el?.closest("input, textarea, select, button[role=slider], [contenteditable=true]")) return;
      const i = activeRef.current;
      if (["ArrowRight", "ArrowDown", "PageDown"].includes(e.key) || (e.key === " " && !e.shiftKey)) {
        e.preventDefault();
        goTo(i + 1);
      } else if (["ArrowLeft", "ArrowUp", "PageUp"].includes(e.key) || (e.key === " " && e.shiftKey)) {
        e.preventDefault();
        goTo(i - 1);
      } else if (e.key === "Home") {
        e.preventDefault();
        goTo(0);
      } else if (e.key === "End") {
        e.preventDefault();
        goTo(frames.length - 1);
      } else if (e.key === "!" || (e.shiftKey && e.code === "Digit1")) {
        toggleOverview();
      } else if (e.key === "Escape") {
        setCommentOpen(false);
        if (overviewRef.current) goTo(i);
      } else if (e.key.toLowerCase() === "c" && !e.metaKey && !e.ctrlKey) {
        setCommentOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, goTo, toggleOverview]);

  // Tryb pionowy: aktywna ramka wg położenia na ekranie
  useEffect(() => {
    if (mode !== "flow") return;
    const els = frames.map((f) => document.getElementById(f.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActiveIdx(frames.findIndex((f) => f.id === e.target.id))),
      { rootMargin: "-45% 0px -50% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [mode]);

  const value: Ctx = {
    mode,
    active,
    zoom,
    overview,
    threeD,
    revealed,
    width: size.W,
    spacer,
    commentOpen,
    prefill,
    setCommentOpen,
    setPrefill,
    goTo,
    goToId,
    toggleOverview,
    worldRef: world,
    tiltRef: tilt,
    bgRef: bg,
  };

  return <CanvasContext.Provider value={value}>{children}</CanvasContext.Provider>;
}
