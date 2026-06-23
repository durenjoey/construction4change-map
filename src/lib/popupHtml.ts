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

/** Full detail popup — photo, stats, type */
export function buildPinnedPopupHTML(props: Record<string, any>): string {
  const isActive = props.status === "active";
  const statusColor = isActive ? PIN_COLORS.active : PIN_COLORS.completed;
  const statusLabel = isActive ? "Active" : "Completed";
  const yr = formatYear(props);
  const location = [props.city, props.country].filter(Boolean).join(", ");
  const safeImageUrl = safeImageSrc(props.imageUrl);
  const imageSection = safeImageUrl
    ? `<div style="height:160px;position:relative">
        <img src="${escapeHtml(safeImageUrl)}" alt="${escapeHtml(props.partner)}" style="width:100%;height:100%;object-fit:cover" />
        <div style="position:absolute;top:10px;right:10px">
          <span style="display:inline-block;font-size:10px;padding:3px 10px;border-radius:9999px;color:white;background:${statusColor};font-weight:600">${statusLabel}</span>
        </div>
      </div>`
    : "";

  return `
    <div style="width:320px;border-radius:10px;background:white;box-shadow:0 6px 24px rgba(0,0,0,0.18);overflow:hidden;border:1px solid #d6d6d6;font-family:Lato,sans-serif">
      ${imageSection}
      <div style="padding:14px 16px">
        <div style="font-weight:700;font-size:16px;color:#374859;line-height:1.3">${escapeHtml(props.partner)}</div>
        ${props.details ? `<div style="font-size:13px;color:#666;margin-top:6px;line-height:1.4">${escapeHtml(props.details)}</div>` : ""}
        <div style="margin-top:12px;display:grid;grid-template-columns:1fr 1fr;gap:8px">
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
          ${props.type ? `
          <div style="background:#f8f7f4;border-radius:6px;padding:8px 10px">
            <div style="font-size:10px;color:#999;text-transform:uppercase;letter-spacing:0.5px">Sector</div>
            <div style="font-size:13px;color:#374859;font-weight:600;margin-top:2px">${escapeHtml(props.type)}</div>
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
            ${p.type ? `<span style="display:inline-block;font-size:9px;padding:1px 8px;border-radius:9999px;color:#374859;background:#faf9f5;border:1px solid #d6d6d6">${escapeHtml(p.type)}</span>` : ""}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-left:auto;flex-shrink:0"><path d="m9 18 6-6-6-6"/></svg>
          </div>
        </div>
      </div>`;
    })
    .join("");

  return `
    <div style="width:300px;max-height:350px;overflow-y:auto;border-radius:8px;background:white;box-shadow:0 4px 20px rgba(0,0,0,0.15);border:1px solid #d6d6d6;font-family:Lato,sans-serif">
      <div style="padding:10px 14px;background:#374859;color:white;font-weight:700;font-size:13px;position:sticky;top:0;z-index:1">
        ${propsList.length} Projects — ${escapeHtml(first.city || first.country || "")}
      </div>
      ${items}
    </div>
  `;
}
