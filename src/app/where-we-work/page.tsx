"use client";

import { useState } from "react";
import { HUBS } from "@/lib/hubs";
import { WhereWeWorkMapCards } from "@/components/WhereWeWorkMapCards";
import { WhereWeWorkSplit } from "@/components/WhereWeWorkSplit";
import { WhereWeWorkScroll } from "@/components/WhereWeWorkScroll";

type Layout = "A" | "B" | "C";

const LAYOUT_INFO: Record<Layout, { label: string; desc: string }> = {
  A: { label: "Map + Cards", desc: "Full-width map with hub cards below" },
  B: { label: "Split View", desc: "Map left, hub details right" },
  C: { label: "Scroll Story", desc: "Scroll through each hub region" },
};

export default function WhereWeWorkPage() {
  const [layout, setLayout] = useState<Layout>("A");

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff" }}>
      {/* Layout picker — for Mike to preview options */}
      <div
        style={{
          position: "fixed",
          top: 56,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 50,
          display: "flex",
          background: "rgba(55,72,89,0.95)",
          borderRadius: "9999px",
          padding: "3px",
          backdropFilter: "blur(10px)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        {(["A", "B", "C"] as Layout[]).map((l) => (
          <button
            key={l}
            onClick={() => setLayout(l)}
            title={LAYOUT_INFO[l].desc}
            style={{
              padding: "8px 18px",
              borderRadius: "9999px",
              fontSize: "12px",
              fontWeight: 700,
              fontFamily: "var(--font-lato), Lato, sans-serif",
              border: "none",
              background: layout === l ? "#cb463a" : "transparent",
              color: layout === l ? "white" : "rgba(255,255,255,0.6)",
              cursor: "pointer",
              transition: "all 0.2s",
              whiteSpace: "nowrap",
            }}
          >
            {LAYOUT_INFO[l].label}
          </button>
        ))}
      </div>

      {layout === "A" && <WhereWeWorkMapCards hubs={HUBS} />}
      {layout === "B" && <WhereWeWorkSplit hubs={HUBS} />}
      {layout === "C" && <WhereWeWorkScroll hubs={HUBS} />}
    </div>
  );
}
