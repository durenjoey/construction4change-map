import { Project } from "@/lib/types";

/**
 * The twelve projects featured on the landing page, in display order.
 * Titles are the names used on constructionforchange.org; `id` is the
 * matching record in src/data/projects.json (null when no record matches,
 * in which case the tile renders without a photo or location).
 */
export interface FeaturedProjectConfig {
  title: string;
  id: string | null;
  /** Index into imageUrls when the cover image is not the best tile (default 0). */
  photoIndex?: number;
}

export const FEATURED_PROJECTS: FeaturedProjectConfig[] = [
  // 6.jpeg is a 616x237 banner; 6-2.jpg is the building photo.
  { title: "Cura Orphanage", id: "6", photoIndex: 1 },
  { title: "FIGS Operating Theatre", id: null },
  { title: "Flying Kites Technology Center", id: "117" },
  { title: "Action in Africa Pavilion", id: "122" },
  { title: "Matibabu Morgue", id: "113" },
  { title: "Douako Health Center", id: "123" },
  { title: "Flying Kites Dormitory", id: "20" },
  { title: "Flying Kites Classroom Block", id: "21" },
  { title: "Flying Kites Preschool", id: "57" },
  { title: "KGSA Dormitory", id: "41" },
  { title: "Kingdom Home", id: "75" },
  { title: "Flying Kites Biodigester", id: "118" },
];

export interface FeaturedProject {
  title: string;
  city: string | null;
  country: string | null;
  year: number | null;
  type: string | null;
  imageUrl: string | null;
}

/** Resolve the featured list against enriched projects (server-side). */
export function getFeaturedProjects(projects: Project[]): FeaturedProject[] {
  const byId = new Map<string, Project>();
  for (const p of projects) if (p.id) byId.set(p.id, p);

  return FEATURED_PROJECTS.map((cfg) => {
    const p = cfg.id ? byId.get(cfg.id) : undefined;
    const urls = p?.imageUrls ?? (p?.imageUrl ? [p.imageUrl] : []);
    const imageUrl = urls[cfg.photoIndex ?? 0] ?? urls[0] ?? null;
    return {
      title: cfg.title,
      city: p?.city ?? null,
      country: p?.country ?? null,
      year: p?.endYear ?? p?.startYear ?? null,
      type: p?.type ?? null,
      imageUrl,
    };
  });
}
