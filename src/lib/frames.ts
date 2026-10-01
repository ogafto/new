import { FRAME_H, FRAME_W } from "./camera";
import { projects } from "./site";

// Kolejność ramek = kolejność przelotu kamery. Pozycje w px świata (płótna).
const GX = FRAME_W + 220;
const ROW_1 = 0;
const ROW_2 = FRAME_H + 300;
const ROW_3 = (FRAME_H + 300) * 2;

export type FrameDef = {
  id: string;
  name: string; // nazwa warstwy
  nav?: string; // etykieta w nawigacji
  x: number;
  y: number;
};

export const frames: FrameDef[] = [
  { id: "start", name: "Start", nav: "Start", x: 0, y: ROW_1 },
  ...projects.map((p, i) => ({ id: `projekt-${p.slug}`, name: `Projekt — ${p.name}`, nav: i === 0 ? "Realizacje" : undefined, x: GX * i, y: ROW_2 })),
  { id: "proces", name: "Proces", nav: "Proces", x: GX * 3, y: ROW_3 },
  { id: "uslugi", name: "Usługi", nav: "Usługi", x: GX * 2, y: ROW_3 },
  { id: "kontakt", name: "Kontakt", nav: "Kontakt", x: GX, y: ROW_3 },
  { id: "koniec", name: "Koniec pliku", x: 0, y: ROW_3 },
];

export const frameIndex = (id: string) => frames.findIndex((f) => f.id === id);

export const worldBounds = {
  x: -200,
  y: -240,
  w: GX * 3 + FRAME_W + 400,
  h: ROW_3 + FRAME_H + 440,
};

export { GX, ROW_1, ROW_2, ROW_3 };
