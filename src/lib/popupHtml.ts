/**
 * Pure HTML builders for the map popups.
 *
 * Kept free of mapbox/client imports so they can be unit-rendered or
 * server-rendered (e.g. for visual checks) as well as injected into the
 * live Mapbox popup via innerHTML. All untrusted values go through
 * escapeHtml / safeImageSrc.
 */
import { escapeHtml, safeImageSrc } from "@/lib/security";

export const PIN_COLORS = {
  active: "#901a1d",
  completed: "#374859",
};

export function formatYear(props: Record<string, any>): string {
  return props.startYear && props.startYear > 0
    ? props.endYear && props.endYear > 0
      ? props.startYear === props.endYear
        ? `${props.startYear}`
        : `${props.startYear}–${props.endYear}`
      : `${props.startYear}–Present`
    : "";
}

/** Full detail popup (Card A, chosen by CfC) — photo on top, name, description, 3 tiles (Location/Year/Status); sector intentionally omitted.
 * opts.backButton renders a subtle top-left arrow (used when the card was opened from a multi-project list). */
export function buildPinnedPopupHTML(
  props: Record<string, any>,
  opts?: { backButton?: boolean }
): string {
  const isActive = props.status === "active";
  const statusColor = isActive ? PIN_COLORS.active : PIN_COLORS.completed;
  const statusLabel = isActive ? "Active" : "Completed";
  const yr = formatYear(props);
  const location = [props.city, props.country].filter(Boolean).join(", ");
  // imageUrls arrives pipe-joined from Mapbox feature properties (arrays get
  // stringified), or as a real array when rendered server-side.
  const rawList: string[] = Array.isArray(props.imageUrls)
    ? props.imageUrls
    : String(props.imageUrls || "").split("|");
  const images = rawList
    .map((u) => safeImageSrc(u))
    .filter((u): u is string => Boolean(u));
  if (!images.length) {
    const single = safeImageSrc(props.imageUrl);
    if (single) images.push(single);
  }

  // Inline handlers: popup HTML is injected via innerHTML, so navigation has
  // to live on the elements themselves (same pattern as the list popup hover).
  const stepJs = (dir: number) =>
    `var c=this.closest('[data-imgs]');var a=c.getAttribute('data-imgs').split('|');` +
    `var i=(parseInt(c.getAttribute('data-i'),10)+(${dir})+a.length)%a.length;` +
    `c.setAttribute('data-i',String(i));c.querySelector('img').src=a[i];` +
    `var d=c.querySelectorAll('[data-dot]');for(var j=0;j&lt;d.length;j++){d[j].style.opacity=(j===i)?'1':'0.45'}`;
  const arrowStyle =
    "position:absolute;top:50%;transform:translateY(-50%);width:26px;height:26px;border-radius:9999px;border:none;cursor:pointer;background:rgba(20,28,36,0.55);color:white;font-size:13px;line-height:26px;text-align:center;padding:0";
  const slideshowControls =
    images.length > 1
      ? `<button aria-label="Previous photo" onclick="${stepJs(-1)}" style="${arrowStyle};left:8px">&#10094;</button>
         <button aria-label="Next photo" onclick="${stepJs(1)}" style="${arrowStyle};right:8px">&#10095;</button>
         <div style="position:absolute;bottom:8px;left:0;right:0;display:flex;justify-content:center;gap:5px">
           ${images
             .map(
               (_, i) =>
                 `<span data-dot style="width:7px;height:7px;border-radius:9999px;background:white;opacity:${i === 0 ? "1" : "0.45"};box-shadow:0 0 3px rgba(0,0,0,0.4)"></span>`
             )
             .join("")}
         </div>`
      : "";

  // Subtle back-to-list arrow, top-left on the photo (or floating over the
  // card top when there is no photo).
  const backButton = opts?.backButton
    ? `<button data-back-btn aria-label="Back to project list" style="position:absolute;top:10px;left:10px;width:26px;height:26px;border-radius:9999px;border:none;cursor:pointer;background:rgba(20,28,36,0.45);color:white;padding:0;display:flex;align-items:center;justify-content:center">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
      </button>`
    : "";

  const imageSection = images.length
    ? `<div data-imgs="${escapeHtml(images.join("|"))}" data-i="0" style="height:160px;position:relative">
        <img src="${escapeHtml(images[0])}" alt="${escapeHtml(props.partner)}" style="width:100%;height:100%;object-fit:cover" />
        <div style="position:absolute;top:10px;right:10px">
          <span style="display:inline-block;font-size:10px;padding:3px 10px;border-radius:9999px;color:white;background:${statusColor};font-weight:600">${statusLabel}</span>
        </div>
        ${slideshowControls}
        ${backButton}
      </div>`
    : opts?.backButton
      ? `<div style="height:38px;background:${statusColor};position:relative">
          <button data-back-btn aria-label="Back to project list" style="position:absolute;top:6px;left:10px;width:26px;height:26px;border-radius:9999px;border:none;cursor:pointer;background:rgba(255,255,255,0.18);color:white;padding:0;display:flex;align-items:center;justify-content:center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
          </button>
        </div>`
      : `<div style="height:5px;background:${statusColor}"></div>`;

  return `
    <div style="width:320px;border-radius:10px;background:white;box-shadow:0 6px 24px rgba(0,0,0,0.18);overflow:hidden;border:1px solid #d6d6d6;font-family:Lato,sans-serif">
      ${imageSection}
      <div style="padding:14px 16px">
        <div style="font-weight:700;font-size:16px;color:#374859;line-height:1.3">${escapeHtml(props.partner)}</div>
        ${props.details ? `<div style="font-size:13px;color:#666;margin-top:6px;line-height:1.4">${escapeHtml(props.details)}</div>` : ""}
        <div style="margin-top:12px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">
          ${location ? `
          <div style="background:#f8f7f4;border-radius:6px;padding:8px 10px">
            <div style="font-size:10px;color:#999;text-transform:uppercase;letter-spacing:0.5px">Location</div>
            <div style="font-size:13px;color:#374859;font-weight:600;margin-top:2px">${escapeHtml(location)}</div>
          </div>` : ""}
          ${yr ? `
          <div style="background:#f8f7f4;border-radius:6px;padding:8px 10px">
            <div style="font-size:10px;color:#999;text-transform:uppercase;letter-spacing:0.5px">Year</div>
            <div style="font-size:13px;color:#374859;font-weight:600;margin-top:2px">${yr}</div>
          </div>` : ""}
          <div style="background:#f8f7f4;border-radius:6px;padding:8px 10px">
            <div style="font-size:10px;color:#999;text-transform:uppercase;letter-spacing:0.5px">Status</div>
            <div style="font-size:13px;font-weight:600;margin-top:2px;color:${statusColor}">${statusLabel}</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/** List popup for overlapping pins — each row now carries a photo thumbnail when present. */
export function buildMultiPopupListHTML(propsList: Record<string, any>[]): string {
  const first = propsList[0];
  const items = propsList
    .map((p, i) => {
      const isActive = p.status === "active";
      const statusColor = isActive ? PIN_COLORS.active : PIN_COLORS.completed;
      const statusLabel = isActive ? "Active" : "Completed";
      const thumb = safeImageSrc(p.imageUrl);
      const thumbHtml = thumb
        ? `<img src="${escapeHtml(thumb)}" alt="${escapeHtml(p.partner)}" style="width:48px;height:48px;border-radius:6px;object-fit:cover;flex-shrink:0" />`
        : `<div style="width:48px;height:48px;border-radius:6px;flex-shrink:0;background:${statusColor};opacity:0.15"></div>`;
      return `
      <div data-project-idx="${i}" style="padding:10px 14px;border-bottom:1px solid #eee;cursor:pointer;transition:background 0.15s;display:flex;gap:10px;align-items:flex-start" onmouseenter="this.style.background='#f8f7f4'" onmouseleave="this.style.background='white'">
        ${thumbHtml}
        <div style="flex:1;min-width:0">
          <div style="font-weight:700;font-size:13px;color:#374859">${escapeHtml(p.partner)}</div>
          ${p.details ? `<div style="font-size:11px;color:#666;margin-top:2px">${escapeHtml(p.details)}</div>` : ""}
          <div style="margin-top:4px;display:flex;align-items:center;gap:4px">
            <span style="display:inline-block;font-size:9px;padding:1px 8px;border-radius:9999px;color:white;background:${statusColor}">${statusLabel}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-left:auto;flex-shrink:0"><path d="m9 18 6-6-6-6"/></svg>
          </div>
        </div>
      </div>`;
    })
    .join("");

  return `
    <div style="width:300px;max-height:350px;overflow-y:auto;border-radius:8px;background:white;box-shadow:0 4px 20px rgba(0,0,0,0.15);border:1px solid #d6d6d6;font-family:Lato,sans-serif">
      <div style="padding:10px 14px;background:#374859;color:white;font-weight:700;font-size:13px;position:sticky;top:0;z-index:1;border-radius:8px 8px 0 0">
        ${propsList.length} Projects — ${escapeHtml(first.city || first.country || "")}
      </div>
      ${items}
    </div>
  `;
}
