"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/", label: "Project Map" },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        height: "48px",
        background: "rgba(55,72,89,0.95)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        fontFamily: "var(--font-lato), Lato, sans-serif",
      }}
    >
      {/* Logo / brand */}
      <Link
        href="/"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          textDecoration: "none",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-oswald), Oswald, sans-serif",
            fontSize: "14px",
            fontWeight: 600,
            color: "white",
            letterSpacing: "1px",
            textTransform: "uppercase",
          }}
        >
          Construction for Change
        </span>
      </Link>

      {/* Nav links */}
      <div style={{ display: "flex", gap: "4px" }}>
        {NAV_LINKS.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              style={{
                padding: "6px 14px",
                borderRadius: "6px",
                fontSize: "13px",
                fontWeight: isActive ? 700 : 400,
                color: isActive ? "white" : "rgba(255,255,255,0.6)",
                background: isActive ? "rgba(203,70,58,0.9)" : "transparent",
                textDecoration: "none",
                transition: "all 0.2s",
              }}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
