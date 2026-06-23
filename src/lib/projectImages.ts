import fs from "fs";
import path from "path";
import { Project } from "@/lib/types";

/**
 * Auto-tag project photos by convention.
 *
 * Drop an image in public/projects/ named after the project's id
 * (e.g. 121.jpg, 121.png, 121.webp) and it is matched to that project's
 * imageUrl automatically — no per-project JSON edits, no manual naming risk.
 *
 * This is the local-filesystem version of the future Vercel Blob flow:
 * same id-prefixed convention, so swapping the source later is a one-file change.
 */
const IMAGE_EXTS = ["jpg", "jpeg", "png", "webp"];

function buildIdToImageMap(): Record<string, string> {
  const dir = path.join(process.cwd(), "public", "projects");
  const map: Record<string, string> = {};
  let entries: string[];
  try {
    entries = fs.readdirSync(dir);
  } catch {
    return map; // folder may not exist yet
  }
  for (const file of entries) {
    const ext = path.extname(file).slice(1).toLowerCase();
    if (!IMAGE_EXTS.includes(ext)) continue;
    const id = path.basename(file, path.extname(file));
    // First match wins; prefer order of IMAGE_EXTS if duplicates exist.
    if (map[id]) {
      const existingExt = path.extname(map[id]).slice(1).toLowerCase();
      if (IMAGE_EXTS.indexOf(ext) >= IMAGE_EXTS.indexOf(existingExt)) continue;
    }
    map[id] = `/projects/${file}`;
  }
  return map;
}

/** Return projects with imageUrl populated from public/projects/<id>.<ext> when present. */
export function enrichProjectsWithImages(projects: Project[]): Project[] {
  const map = buildIdToImageMap();
  return projects.map((p) =>
    p.id && map[p.id] ? { ...p, imageUrl: map[p.id] } : p
  );
}
