import fs from "fs";
import path from "path";
import { Project } from "@/lib/types";
import photoAlts from "@/data/projectPhotoAlts.json";

/**
 * Auto-tag project photos by convention.
 *
 * Drop an image in public/projects/ named after the project's id
 * (e.g. 121.jpg, 121.png, 121.webp) and it is matched to that project's
 * imageUrl automatically: no per-project JSON edits, no manual naming risk.
 *
 * Extra photos for the same project use an ordinal suffix: 6.jpeg is the
 * cover, 6-2.jpg / 6-3.png follow it in the card slideshow.
 *
 * Alt text is optional: add the file name and a one-sentence description of
 * the photo to src/data/projectPhotoAlts.json. A photo without an entry uses
 * the project name.
 *
 * This is the local-filesystem version of the future Vercel Blob flow:
 * same id-prefixed convention, so swapping the source later is a one-file change.
 */
const IMAGE_EXTS = ["jpg", "jpeg", "png", "webp"];

// <id>.<ext> (cover, ordinal 1) or <id>-<n>.<ext> (ordinal n).
// Ids are numeric ("121") or letter-prefixed for active projects ("A3").
const IMAGE_FILE = /^([A-Za-z]*\d+)(?:-(\d+))?\.(jpg|jpeg|png|webp)$/i;

const PHOTO_ALTS = photoAlts as Record<string, string>;

/** Alt text for one photo, looked up by file name. The popup carries alts pipe-joined, so pipes are removed. */
function altFor(url: string): string {
  return (PHOTO_ALTS[path.basename(url)] || "").replace(/\|/g, " ").trim();
}

function buildIdToImagesMap(): Record<string, string[]> {
  const dir = path.join(process.cwd(), "public", "projects");
  const byId: Record<string, { ord: number; url: string }[]> = {};
  let entries: string[];
  try {
    entries = fs.readdirSync(dir);
  } catch {
    return {}; // folder may not exist yet
  }
  for (const file of entries) {
    const m = file.match(IMAGE_FILE);
    if (!m) continue;
    const [, id, ordStr] = m;
    const ord = ordStr ? parseInt(ordStr, 10) : 1;
    (byId[id] ||= []).push({ ord, url: `/projects/${file}` });
  }
  const map: Record<string, string[]> = {};
  for (const [id, imgs] of Object.entries(byId)) {
    // Cover first, then by ordinal; ext order breaks ties for duplicate ordinals.
    imgs.sort(
      (a, b) =>
        a.ord - b.ord ||
        IMAGE_EXTS.indexOf(path.extname(a.url).slice(1).toLowerCase()) -
          IMAGE_EXTS.indexOf(path.extname(b.url).slice(1).toLowerCase())
    );
    map[id] = imgs.map((i) => i.url);
  }
  return map;
}

/** Return projects with imageUrl/imageUrls/imageAlts populated from public/projects/<id>[-<n>].<ext>. */
export function enrichProjectsWithImages(projects: Project[]): Project[] {
  const map = buildIdToImagesMap();
  return projects.map((p) =>
    p.id && map[p.id]
      ? { ...p, imageUrl: map[p.id][0], imageUrls: map[p.id], imageAlts: map[p.id].map(altFor) }
      : p
  );
}
