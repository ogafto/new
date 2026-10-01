import { all, one, run } from "./db";
import { id } from "./auth/crypto";
import { defaultProjects, type Project, type ServiceId } from "./site";

/* Portfolio w bazie — edytowane z panelu admina. Przy pierwszym uruchomieniu wpisują się projekty startowe. */

type Row = {
  id: string;
  slug: string;
  name: string;
  category: ServiceId;
  year: string;
  client: string;
  description: string;
  scope: string;
  palette: string;
  image: string;
  gallery: string;
  url: string | null;
  featured: number;
  published: number;
  sort: number;
  created_at: number;
  updated_at: number;
};

export type AdminProject = Project & { id: string; featured: boolean; published: boolean; sort: number; updated_at: number };

const parse = (v: string) => {
  try {
    const x = JSON.parse(v);
    return Array.isArray(x) ? (x as string[]) : [];
  } catch {
    return [];
  }
};

const toProject = (r: Row): AdminProject => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  category: r.category,
  year: r.year,
  client: r.client,
  description: r.description,
  scope: parse(r.scope),
  palette: parse(r.palette),
  image: r.image,
  gallery: parse(r.gallery),
  url: r.url,
  featured: !!r.featured,
  published: !!r.published,
  sort: r.sort,
  updated_at: r.updated_at,
});

let seeded: Promise<void> | null = null;
function seed() {
  seeded ??= (async () => {
    if (await one("SELECT 1 FROM meta WHERE key = 'projects_seeded'")) return;
    const now = Date.now();
    for (const [i, p] of defaultProjects.entries()) {
      await run(
        `INSERT OR IGNORE INTO projects (id, slug, name, category, year, client, description, scope, palette, image, gallery, featured, published, sort, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
        [id(), p.slug, p.name, p.category, p.year, p.client, p.description, JSON.stringify(p.scope), JSON.stringify(p.palette), p.image, JSON.stringify(p.gallery ?? []), i < 6 ? 1 : 0, i, now, now],
      );
    }
    await run("INSERT OR REPLACE INTO meta (key, value) VALUES ('projects_seeded', '1')");
  })().catch((e) => {
    seeded = null;
    throw e;
  });
  return seeded;
}

// Publiczne: opublikowane projekty w ustalonej kolejności
export async function getProjects() {
  await seed();
  return (await all<Row>("SELECT * FROM projects WHERE published = 1 ORDER BY sort, created_at DESC")).map(toProject);
}

export async function getProjectBySlug(slug: string) {
  await seed();
  const r = await one<Row>("SELECT * FROM projects WHERE slug = ? AND published = 1", [slug]);
  return r ? toProject(r) : null;
}

// Panel: wszystkie, także ukryte
export async function getAllProjects() {
  await seed();
  return (await all<Row>("SELECT * FROM projects ORDER BY sort, created_at DESC")).map(toProject);
}

export async function getProjectById(pid: string) {
  await seed();
  const r = await one<Row>("SELECT * FROM projects WHERE id = ?", [pid]);
  return r ? toProject(r) : null;
}
