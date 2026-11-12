import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { all, one, run } from "./db";
import { id } from "./auth/crypto";
import { defaultProjects } from "./site";
import { slugify } from "./slug";
import { UPLOAD_DIR } from "./storage";
import { setting } from "./settings";
import { isGif, isVideo } from "./media";

/*
 * Portfolio: kategorie (Logo, Strony, Banery…) i prace w nich. Wszystko edytowane w panelu admina.
 * Kolejność: najmniejszy `sort` pierwszy. Nowa kategoria ląduje na początku strony, nowa praca
 * na końcu swojej kategorii (zdjęcia idą jedno pod drugim). Przeciąganie w panelu ustawia kolejność ręcznie.
 */

export type Work = {
  id: string;
  slug: string;
  name: string;
  categoryId: string;
  client: string;
  year: string;
  description: string;
  image: string;
  w: number; // proporcje zdjęcia głównego (do układu siatki); 4:3, gdy nieznane
  h: number;
  gallery: string[];
  url: string | null;
  published: boolean;
  sort: number;
  createdAt: number;
};

export type Category = {
  id: string;
  slug: string;
  name: string;
  description: string;
  cover: string; // własna okładka; pusta = zdjęcie pierwszej pracy
  published: boolean;
  sort: number;
  createdAt: number;
};

export type CategoryFull = Category & { image: string; works: Work[] };

type WorkRow = {
  id: string;
  slug: string;
  name: string;
  category: string;
  category_id: string | null;
  year: string;
  client: string;
  description: string;
  image: string;
  gallery: string;
  url: string | null;
  w: number | null;
  h: number | null;
  published: number;
  sort: number;
  created_at: number;
};

type CatRow = { id: string; slug: string; name: string; description: string; cover: string; published: number; sort: number; created_at: number };

const list = (v: string) => {
  try {
    const x = JSON.parse(v);
    return Array.isArray(x) ? (x as string[]).filter((u) => typeof u === "string" && u) : [];
  } catch {
    return [];
  }
};

const toWork = (r: WorkRow): Work => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  categoryId: r.category_id ?? "",
  client: r.client ?? "",
  year: r.year ?? "",
  description: r.description ?? "",
  image: r.image,
  w: Number(r.w) || 4,
  h: Number(r.h) || 3,
  gallery: list(r.gallery),
  url: r.url,
  published: !!Number(r.published),
  sort: Number(r.sort),
  createdAt: Number(r.created_at),
});

const toCategory = (r: CatRow): Category => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  description: r.description ?? "",
  cover: r.cover ?? "",
  published: !!Number(r.published),
  sort: Number(r.sort),
  createdAt: Number(r.created_at),
});

/* ---------- przygotowanie bazy: projekty startowe + przeniesienie starych prac do kategorii ---------- */

// stare prace miały na sztywno typ usługi — z niego powstają pierwsze kategorie
const LEGACY: Record<string, string> = { www: "Strony internetowe", shop: "Sklepy internetowe", brand: "Identyfikacja wizualna", ui: "Projekty UI/UX" };

async function legacyName(key: string) {
  if (LEGACY[key]) return LEGACY[key];
  try {
    const r = await one<{ value: string }>("SELECT value FROM meta WHERE key = 'content'");
    const custom = (r ? JSON.parse(r.value)?.customServices : null) as { id: string; name: string }[] | null;
    const x = custom?.find((s) => s.id === key);
    if (x?.name) return String(x.name).slice(0, 60);
  } catch {}
  return "Inne";
}

export async function uniqueSlug(table: "categories" | "projects", base: string, except = "") {
  const root = slugify(base) || (table === "categories" ? "kategoria" : "praca");
  let slug = root;
  for (let i = 2; await one(`SELECT 1 FROM ${table} WHERE slug = ? AND id != ?`, [slug, except]); i++) slug = `${root}-${i}`;
  return slug;
}

let ready: Promise<void> | null = null;
function prepare() {
  ready ??= (async () => {
    if (!(await one("SELECT 1 FROM meta WHERE key = 'projects_seeded'"))) {
      const now = Date.now();
      for (const [i, p] of defaultProjects.entries()) {
        await run(
          `INSERT OR IGNORE INTO projects (id, slug, name, category, year, client, description, scope, palette, image, gallery, featured, published, sort, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, ?, ?, ?)`,
          [id(), p.slug, p.name, p.category, p.year, p.client, p.description, JSON.stringify(p.scope), JSON.stringify(p.palette), p.image, JSON.stringify(p.gallery ?? []), i, now, now],
        );
      }
      await run("INSERT OR REPLACE INTO meta (key, value) VALUES ('projects_seeded', '1')");
    }

    const orphans = await all<{ category: string; s: number }>(
      "SELECT category, MIN(sort) s FROM projects WHERE category_id IS NULL OR category_id NOT IN (SELECT id FROM categories) GROUP BY category ORDER BY s",
    );
    for (const o of orphans) {
      const name = await legacyName(o.category);
      let cat = await one<{ id: string }>("SELECT id FROM categories WHERE name = ?", [name]);
      if (!cat) {
        const now = Date.now();
        const next = await one<{ n: number }>("SELECT COALESCE(MAX(sort), -1) + 1 n FROM categories");
        cat = { id: id() };
        await run("INSERT INTO categories (id, slug, name, description, cover, published, sort, created_at, updated_at) VALUES (?, ?, ?, '', '', 1, ?, ?, ?)", [
          cat.id,
          await uniqueSlug("categories", name),
          name,
          Number(next?.n ?? 0),
          now,
          now,
        ]);
      }
      await run("UPDATE projects SET category_id = ? WHERE category = ? AND (category_id IS NULL OR category_id NOT IN (SELECT id FROM categories))", [cat.id, o.category]);
    }
  })().catch((e) => {
    ready = null;
    throw e;
  });
  return ready;
}

/* ---------- proporcje zdjęć (prace sprzed zapisywania wymiarów) ---------- */

async function readImage(url: string): Promise<Buffer | null> {
  if (url.startsWith("/media/b/")) {
    const token = await setting("blob_token");
    if (!token) return null;
    const { get } = await import("@vercel/blob");
    const r = await get(url.slice("/media/b/".length), { access: "private", token }).catch(() => null);
    return r?.stream ? Buffer.from(await new Response(r.stream).arrayBuffer()) : null;
  }
  if (url.startsWith("/media/")) return readFile(path.join(/*turbopackIgnore: true*/ UPLOAD_DIR, url.slice("/media/".length)));
  if (url.startsWith("/")) return readFile(path.join(/*turbopackIgnore: true*/ process.cwd(), "public", url));
  if (url.startsWith("https://")) {
    const r = await fetch(url);
    return r.ok ? Buffer.from(await r.arrayBuffer()) : null;
  }
  return null;
}

const tried = new Set<string>();
async function fillSizes(rows: WorkRow[]) {
  // wideo: wymiary zapisuje panel przy wgrywaniu (sharp ich nie odczyta)
  const missing = rows.filter((r) => !(Number(r.w) > 0 && Number(r.h) > 0) && !tried.has(r.id) && !isVideo(r.image)).slice(0, 24);
  await Promise.all(
    missing.map(async (r) => {
      tried.add(r.id);
      try {
        const buf = await readImage(r.image);
        if (!buf) return;
        const m = await sharp(buf).metadata();
        if (!m.width || !m.height) return;
        r.w = m.width;
        r.h = m.height;
        await run("UPDATE projects SET w = ?, h = ? WHERE id = ?", [m.width, m.height, r.id]);
      } catch {}
    }),
  );
}

/* ---------- strona publiczna ---------- */

const ORDER = "ORDER BY sort, created_at DESC";

/** Opublikowane kategorie z opublikowanymi pracami (puste kategorie się nie pokazują) */
export async function getPortfolio(): Promise<CategoryFull[]> {
  await prepare();
  const [cats, rows] = await Promise.all([all<CatRow>(`SELECT * FROM categories WHERE published = 1 ${ORDER}`), all<WorkRow>(`SELECT * FROM projects WHERE published = 1 ${ORDER}`)]);
  await fillSizes(rows);
  const works = rows.map(toWork);
  return cats
    .map(toCategory)
    .map((c) => {
      const items = works.filter((w) => w.categoryId === c.id);
      return { ...c, works: items, image: c.cover || items[0]?.image || "" };
    })
    .filter((c) => c.works.length > 0);
}

/** Najnowsze prace ze wszystkich kategorii (miniatury w hero) */
export function latestWorks(cats: CategoryFull[], n = 4) {
  return cats
    .flatMap((c) => c.works.map((w) => ({ ...w, category: c.slug })))
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, n);
}

/** Stary adres pracy (/portfolio/nazwa-pracy) → jej kategoria */
export async function findWork(slug: string) {
  await prepare();
  const r = await one<WorkRow & { cat_slug: string }>(
    "SELECT p.*, c.slug cat_slug FROM projects p JOIN categories c ON c.id = p.category_id WHERE p.slug = ? AND p.published = 1 AND c.published = 1",
    [slug],
  );
  return r ? { work: toWork(r), category: r.cat_slug } : null;
}

/* ---------- panel ---------- */

export type AdminCategory = Category & { image: string; count: number; hidden: number; updatedAt: number };

export async function adminCategories(): Promise<AdminCategory[]> {
  await prepare();
  const [cats, works] = await Promise.all([
    all<CatRow & { updated_at: number }>(`SELECT * FROM categories ${ORDER}`),
    all<{ category_id: string; image: string; published: number }>(`SELECT category_id, image, published FROM projects ${ORDER}`),
  ]);
  return cats.map((r) => {
    const mine = works.filter((w) => w.category_id === r.id);
    return {
      ...toCategory(r),
      image: r.cover || mine[0]?.image || "",
      count: mine.length,
      hidden: mine.filter((w) => !Number(w.published)).length,
      updatedAt: Number(r.updated_at),
    };
  });
}

/** Prace, których plik to GIF (w panelu: propozycja zamiany na lżejsze wideo) */
export async function adminGifs() {
  await prepare();
  const rows = await all<{ id: string; name: string; image: string }>(`SELECT id, name, image FROM projects ${ORDER}`);
  return rows.filter((r) => isGif(r.image)).map((r) => ({ id: r.id, name: r.name, image: r.image }));
}

export async function adminCategory(cid: string) {
  await prepare();
  const r = await one<CatRow>("SELECT * FROM categories WHERE id = ?", [cid]);
  if (!r) return null;
  const rows = await all<WorkRow>(`SELECT * FROM projects WHERE category_id = ? ${ORDER}`, [cid]);
  await fillSizes(rows);
  const works = rows.map(toWork);
  return { ...toCategory(r), image: r.cover || works[0]?.image || "", works };
}

export async function adminWork(wid: string) {
  await prepare();
  const r = await one<WorkRow>("SELECT * FROM projects WHERE id = ?", [wid]);
  return r ? toWork(r) : null;
}

/** Wszystkie prace (statystyki w panelu: nazwy zamiast adresów) */
export async function allWorks() {
  await prepare();
  return (await all<WorkRow>(`SELECT * FROM projects ${ORDER}`)).map(toWork);
}
