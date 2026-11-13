import fs from "fs";
import path from "path";
import { Project } from "@/lib/types";
import photoText from "@/data/projectPhotoText.json";

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
 * Alt text and captions are optional and live in src/data/projectPhotoText.json,
 * keyed by file name. "alt" is a one-sentence description of the photo; a photo
 * without one uses the project name. "caption" is a short label shown on the
 * photo in the card, such as "Project site".
 *
 * This is the local-filesystem version of the future Vercel Blob flow:
 * same id-prefixed convention, so swapping the source later is a one-file change.
 */
const IMAGE_EXTS = ["jpg", "jpeg", "png", "webp"];

// <id>.<ext> (cover, ordinal 1) or <id>-<n>.<ext> (ordinal n).
// Ids are numeric ("121") or letter-prefixed for active projects ("A3").
const IMAGE_FILE = /^([A-Za-z]*\d+)(?:-(\d+))?\.(jpg|jpeg|png|webp)$/i;

const PHOTO_TEXT = photoText as Record<string, { alt?: string; caption?: string }>;

/** Alt text or caption for one photo, looked up by file name. The popup carries these pipe-joined, so pipes are removed. */
function textFor(url: string, field: "alt" | "caption"): string {
  return (PHOTO_TEXT[path.basename(url)]?.[field] || "").replace(/\|/g, " ").trim();
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

/** Return projects with imageUrl, imageUrls, imageAlts and imageCaptions populated from public/projects/<id>[-<n>].<ext>. */
export function enrichProjectsWithImages(projects: Project[]): Project[] {
  const map = buildIdToImagesMap();
  return projects.map((p) =>
    p.id && map[p.id]
      ? {
          ...p,
          imageUrl: map[p.id][0],
          imageUrls: map[p.id],
          imageAlts: map[p.id].map((u) => textFor(u, "alt")),
          imageCaptions: map[p.id].map((u) => textFor(u, "caption")),
        }
      : p
  );
}
