"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Project } from "@/lib/types";

const HeroGlobeCanvas = dynamic(() => import("./HeroGlobeCanvas"), {
  ssr: false,
});

export interface HeroCta {
  label: string;
  href: string;
}

interface HeroGlobeProps {
  projects: Project[];
  /** Small Oswald line above the headline (optional). */
  tagline?: string;
  headline?: string;
  subheadline?: string;
  primaryCta?: HeroCta;
  secondaryCta?: HeroCta;
  /** Show the CfC logo above the headline (default true). */
  showLogo?: boolean;
}

const DEFAULT_HEADLINE = "BUILDING FOR COMMUNITIES WORLDWIDE";
const DEFAULT_SUBHEADLINE =
  "Since 2008, we have partnered with organizations across 24 countries to deliver schools, clinics, and community infrastructure where it is needed most.";
const DEFAULT_PRIMARY: HeroCta = { label: "Explore Our Projects", href: "#map" };
const DEFAULT_SECONDARY: HeroCta = {
  label: "Our Story",
  href: "https://www.constructionforchange.org",
};

const isExternal = (href: string) => /^https?:\/\//.test(href);

function CtaLink({
  cta,
  className,
}: {
  cta: HeroCta;
  className: string;
}) {
  if (isExternal(cta.href)) {
    return (
      <a
        href={cta.href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {cta.label}
      </a>
    );
  }
  return (
    <Link href={cta.href} className={className}>
      {cta.label}
    </Link>
  );
}

export function HeroGlobe({
  projects,
  tagline,
  headline = DEFAULT_HEADLINE,
  subheadline = DEFAULT_SUBHEADLINE,
  primaryCta = DEFAULT_PRIMARY,
  secondaryCta = DEFAULT_SECONDARY,
  showLogo = true,
}: HeroGlobeProps) {
  return (
    <section
      aria-label="Introduction"
      className="cfc-hero"
      style={{
        position: "relative",
        minHeight: "560px",
        width: "100%",
        overflow: "hidden",
        background: "rgb(5, 5, 20)",
      }}
    >
      {/* Globe background (lazy, client-only) */}
      <HeroGlobeCanvas projects={projects} />

      {/* Dark overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(5, 5, 20, 0.45)",
          pointerEvents: "none",
        }}
      />

      {/* Hero content */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "72px 24px 88px",
          pointerEvents: "none",
        }}
      >
        {showLogo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/cfc-logo.png"
            alt="Construction for Change"
            style={{ width: "200px", marginBottom: "32px", filter: "brightness(1.1)" }}
          />
        )}
        {tagline && (
          <p
            style={{
              fontFamily: "var(--font-oswald), Oswald, sans-serif",
              fontSize: "clamp(13px, 1.4vw, 16px)",
              fontWeight: 400,
              color: "#ffffff",
              letterSpacing: "4px",
              textTransform: "uppercase",
              margin: "0 0 20px",
              padding: "6px 14px",
              borderLeft: "3px solid #cb463a",
              borderRight: "3px solid #cb463a",
              textShadow: "0 1px 10px rgba(0,0,0,0.4)",
            }}
          >
            {tagline}
          </p>
        )}
        <h1
          style={{
            fontFamily: "var(--font-lato), Lato, sans-serif",
            fontSize: "clamp(34px, 5.4vw, 64px)",
            fontWeight: 900,
            color: "white",
            letterSpacing: "-0.5px",
            lineHeight: 1.08,
            margin: "0 0 20px",
            maxWidth: "900px",
            textShadow: "0 2px 20px rgba(0,0,0,0.4)",
          }}
        >
          {headline}
        </h1>
        <p
          style={{
            fontFamily: "var(--font-lato), Lato, sans-serif",
            fontSize: "clamp(17px, 2vw, 22px)",
            fontWeight: 300,
            color: "rgba(255,255,255,0.88)",
            maxWidth: "640px",
            lineHeight: 1.6,
            margin: "0 0 40px",
            textShadow: "0 1px 10px rgba(0,0,0,0.3)",
          }}
        >
          {subheadline}
        </p>
        <div
          style={{
            display: "flex",
            gap: "16px",
            flexWrap: "wrap",
            justifyContent: "center",
            pointerEvents: "auto",
          }}
        >
          <CtaLink cta={primaryCta} className="cfc-btn-primary" />
          <CtaLink cta={secondaryCta} className="cfc-btn-ghost on-dark" />
        </div>
      </div>

      {/* Scroll indicator (hidden on short viewports via .cfc-hero-scroll) */}
      <div
        className="cfc-hero-scroll"
        style={{
          position: "absolute",
          bottom: 30,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "8px",
          pointerEvents: "none",
        }}
      >
        <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", letterSpacing: "2px", textTransform: "uppercase" }}>
          Scroll to explore
        </span>
        <div
          style={{
            width: "24px",
            height: "38px",
            borderRadius: "12px",
            border: "2px solid rgba(255,255,255,0.3)",
            display: "flex",
            justifyContent: "center",
            paddingTop: "6px",
          }}
        >
          <div
            style={{
              width: "4px",
              height: "8px",
              borderRadius: "2px",
              background: "rgba(255,255,255,0.5)",
              animation: "scrollBounce 1.5s ease-in-out infinite",
            }}
          />
        </div>
      </div>
    </section>
  );
}
