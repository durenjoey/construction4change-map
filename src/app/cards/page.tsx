import { getDemoProject } from "@/lib/cardPreview";
import {
  buildCardImageTop,
  buildCardImageRight,
  buildCardInset,
  buildCardHero,
} from "@/lib/popupVariants";

// Hub page linking the four shareable card-layout options. Live map (/) untouched.
export default function CardsIndex() {
  const p = getDemoProject();
  const options = [
    { href: "/cards/top", title: "A — Image on top", note: "Photo banner, 3 stat tiles", html: buildCardImageTop(p) },
    { href: "/cards/right", title: "B — Image on the right", note: "Text + stacked items, photo on the edge", html: buildCardImageRight(p) },
    { href: "/cards/hero", title: "C — Hero overlay", note: "Photo-forward, text over image", html: buildCardHero(p) },
    { href: "/cards/inset", title: "D — Embedded in the side", note: "Photo contained beside the items", html: buildCardInset(p) },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#e9eef2", padding: "40px 48px", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ color: "#374859", fontSize: 22, margin: 0 }}>Map card — layout options</h1>
      <p style={{ color: "#777", fontSize: 14, marginTop: 6, maxWidth: 640 }}>
        Four ways to show a project card (sector removed). Same project (Action in Africa, Nakuwadde
        Kitchen) in each. Click a card for its own shareable page.
      </p>
      <div style={{ display: "flex", gap: 40, flexWrap: "wrap", alignItems: "flex-start", marginTop: 28 }}>
        {options.map((o) => (
          <a key={o.href} href={o.href} style={{ textDecoration: "none", display: "flex", flexDirection: "column", gap: 10 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#374859" }}>{o.title}</div>
              <div style={{ fontSize: 12, color: "#777" }}>{o.note}</div>
            </div>
            <div dangerouslySetInnerHTML={{ __html: o.html }} />
          </a>
        ))}
      </div>
    </div>
  );
}
