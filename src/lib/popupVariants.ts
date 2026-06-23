/**
 * EXPERIMENTAL card layout variants for the map popup (card-redesign branch).
 *
 * Three options to compare. Sector is intentionally omitted per the owner's
 * request. Each takes the same project-shaped props and returns popup HTML.
 * Once a direction is chosen, the winner replaces buildPinnedPopupHTML.
 */
import { escapeHtml, safeImageSrc } from "@/lib/security";
import { PIN_COLORS, formatYear } from "@/lib/popupHtml";

type Props = Record<string, any>;

function statusOf(props: Props) {
  const isActive = props.status === "active";
  return {
    color: isActive ? PIN_COLORS.active : PIN_COLORS.completed,
    label: isActive ? "Active" : "Completed",
  };
}

function tile(label: string, value: string): string {
  return `
    <div style="background:#f8f7f4;border-radius:6px;padding:8px 10px;min-width:0">
      <div style="font-size:10px;color:#999;text-transform:uppercase;letter-spacing:0.5px">${label}</div>
      <div style="font-size:13px;color:#374859;font-weight:600;margin-top:2px">${value}</div>
    </div>`;
}

function stackedRow(label: string, valueHtml: string): string {
  return `
    <div style="display:flex;flex-direction:column;gap:1px">
      <div style="font-size:10px;color:#999;text-transform:uppercase;letter-spacing:0.5px">${label}</div>
      <div style="font-size:13px;color:#374859;font-weight:600">${valueHtml}</div>
    </div>`;
}

const SHELL =
  "border-radius:10px;background:white;box-shadow:0 6px 24px rgba(0,0,0,0.18);overflow:hidden;border:1px solid #d6d6d6;font-family:Lato,sans-serif";

/** A — image on top, 3 stat tiles, no sector. */
export function buildCardImageTop(props: Props): string {
  const { color, label } = statusOf(props);
  const yr = formatYear(props);
  const location = [props.city, props.country].filter(Boolean).join(", ");
  const img = safeImageSrc(props.imageUrl);
  const imageSection = img
    ? `<div style="height:160px;position:relative">
        <img src="${escapeHtml(img)}" alt="${escapeHtml(props.partner)}" style="width:100%;height:100%;object-fit:cover" />
        <span style="position:absolute;top:10px;right:10px;font-size:10px;padding:3px 10px;border-radius:9999px;color:white;background:${color};font-weight:600">${label}</span>
      </div>`
    : `<div style="height:5px;background:${color}"></div>`;
  return `
    <div style="width:320px;${SHELL}">
      ${imageSection}
      <div style="padding:14px 16px">
        <div style="font-weight:700;font-size:16px;color:#374859;line-height:1.3">${escapeHtml(props.partner)}</div>
        ${props.details ? `<div style="font-size:13px;color:#666;margin-top:6px;line-height:1.4">${escapeHtml(props.details)}</div>` : ""}
        <div style="margin-top:12px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">
          ${tile("Location", escapeHtml(location))}
          ${yr ? tile("Year", yr) : ""}
          ${tile("Status", `<span style="color:${color}">${label}</span>`)}
        </div>
      </div>
    </div>`;
}

/** B — image on the right, text + 3 stacked items on the left, no sector. */
export function buildCardImageRight(props: Props): string {
  const { color, label } = statusOf(props);
  const yr = formatYear(props);
  const location = [props.city, props.country].filter(Boolean).join(", ");
  const img = safeImageSrc(props.imageUrl);
  const imageCol = img
    ? `<div style="width:118px;flex-shrink:0;position:relative">
        <img src="${escapeHtml(img)}" alt="${escapeHtml(props.partner)}" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0" />
      </div>`
    : `<div style="width:6px;flex-shrink:0;background:${color}"></div>`;
  return `
    <div style="width:360px;${SHELL};display:flex;align-items:stretch">
      <div style="flex:1;min-width:0;padding:14px 16px">
        <div style="font-weight:700;font-size:16px;color:#374859;line-height:1.3">${escapeHtml(props.partner)}</div>
        ${props.details ? `<div style="font-size:13px;color:#666;margin-top:6px;line-height:1.4">${escapeHtml(props.details)}</div>` : ""}
        <div style="margin-top:14px;display:flex;flex-direction:column;gap:10px">
          ${stackedRow("Location", escapeHtml(location))}
          ${yr ? stackedRow("Year", yr) : ""}
          ${stackedRow("Status", `<span style="color:${color}">${label}</span>`)}
        </div>
      </div>
      ${imageCol}
    </div>`;
}

/** D — image inset/embedded within the card on the right, beside the 3 items. */
export function buildCardInset(props: Props): string {
  const { color, label } = statusOf(props);
  const yr = formatYear(props);
  const location = [props.city, props.country].filter(Boolean).join(", ");
  const img = safeImageSrc(props.imageUrl);
  const inset = img
    ? `<img src="${escapeHtml(img)}" alt="${escapeHtml(props.partner)}" style="width:112px;height:112px;border-radius:8px;object-fit:cover;flex-shrink:0" />`
    : `<div style="width:112px;height:112px;border-radius:8px;flex-shrink:0;background:${color};opacity:0.12"></div>`;
  return `
    <div style="width:360px;${SHELL}">
      <div style="padding:16px">
        <div style="font-weight:700;font-size:16px;color:#374859;line-height:1.3">${escapeHtml(props.partner)}</div>
        ${props.details ? `<div style="font-size:13px;color:#666;margin-top:6px;line-height:1.4">${escapeHtml(props.details)}</div>` : ""}
        <div style="margin-top:14px;display:flex;gap:14px;align-items:center">
          <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:10px">
            ${stackedRow("Location", escapeHtml(location))}
            ${yr ? stackedRow("Year", yr) : ""}
            ${stackedRow("Status", `<span style="color:${color}">${label}</span>`)}
          </div>
          ${inset}
        </div>
      </div>
    </div>`;
}

/** C — hero: full-bleed photo with gradient, name + meta over the image. */
export function buildCardHero(props: Props): string {
  const { color, label } = statusOf(props);
  const yr = formatYear(props);
  const location = [props.city, props.country].filter(Boolean).join(", ");
  const img = safeImageSrc(props.imageUrl);
  const meta = [location, yr].filter(Boolean).join("  ·  ");
  if (!img) {
    // Fallback when no photo: solid header band reusing the same structure.
    return `
      <div style="width:320px;${SHELL}">
        <div style="background:${color};padding:18px 16px">
          <div style="font-weight:700;font-size:17px;color:white;line-height:1.25">${escapeHtml(props.partner)}</div>
          <div style="font-size:12px;color:rgba(255,255,255,0.85);margin-top:4px">${escapeHtml(meta)}</div>
        </div>
        ${props.details ? `<div style="padding:12px 16px;font-size:13px;color:#666;line-height:1.4">${escapeHtml(props.details)}</div>` : ""}
      </div>`;
  }
  return `
    <div style="width:320px;${SHELL}">
      <div style="position:relative;height:210px">
        <img src="${escapeHtml(img)}" alt="${escapeHtml(props.partner)}" style="width:100%;height:100%;object-fit:cover" />
        <span style="position:absolute;top:12px;right:12px;font-size:10px;padding:3px 10px;border-radius:9999px;color:white;background:${color};font-weight:600">${label}</span>
        <div style="position:absolute;inset:0;background:linear-gradient(to top, rgba(20,28,36,0.92) 0%, rgba(20,28,36,0.45) 38%, rgba(20,28,36,0) 65%)"></div>
        <div style="position:absolute;left:0;right:0;bottom:0;padding:14px 16px">
          <div style="font-weight:700;font-size:18px;color:white;line-height:1.25;text-shadow:0 1px 3px rgba(0,0,0,0.4)">${escapeHtml(props.partner)}</div>
          ${meta ? `<div style="font-size:12px;color:rgba(255,255,255,0.92);margin-top:4px;text-shadow:0 1px 2px rgba(0,0,0,0.5)">${escapeHtml(meta)}</div>` : ""}
        </div>
      </div>
      ${props.details ? `<div style="padding:12px 16px;font-size:13px;color:#555;line-height:1.4">${escapeHtml(props.details)}</div>` : ""}
    </div>`;
}
