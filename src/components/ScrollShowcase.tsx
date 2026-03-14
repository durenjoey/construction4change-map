"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Project, getTypeColor } from "@/lib/types";

interface Section {
  id: string;
  style: string;
  projection: "globe" | "mercator";
  fog: mapboxgl.FogSpecification | null;
  pinColor: "brand" | "typed";
  title: string;
  subtitle: string;
  description: string;
}

const SECTIONS: Section[] = [
  {
    id: "hero",
    style: "mapbox://styles/mapbox/satellite-streets-v12",
    projection: "globe",
    fog: {
      color: "rgb(220, 230, 240)",
      "high-color": "rgb(70, 130, 220)",
      "horizon-blend": 0.03,
      "space-color": "rgb(5, 5, 20)",
      "star-intensity": 0.8,
    },
    pinColor: "brand",
    title: "CONSTRUCTION FOR CHANGE",
    subtitle: "",
    description: "Scroll down to see different views",
  },
  {
    id: "earth",
    style: "mapbox://styles/mapbox/satellite-streets-v12",
    projection: "globe",
    fog: {
      color: "rgb(220, 230, 240)",
      "high-color": "rgb(70, 130, 220)",
      "horizon-blend": 0.03,
      "space-color": "rgb(5, 5, 20)",
      "star-intensity": 0.8,
    },
    pinColor: "typed",
    title: "EARTH VIEW",
    subtitle: "Satellite Globe",
    description:
      "Real satellite imagery with your projects color-coded by type. Healthcare, education, housing, solar — each category has its own color so visitors can see the breadth of your work at a glance.",
  },
  {
    id: "light",
    style: "mapbox://styles/mapbox/light-v11",
    projection: "globe",
    fog: {
      color: "rgb(255, 255, 255)",
      "high-color": "rgb(200, 210, 220)",
      "horizon-blend": 0.04,
      "space-color": "rgb(235, 238, 242)",
      "star-intensity": 0,
    },
    pinColor: "typed",
    title: "LIGHT VIEW",
    subtitle: "Clean Globe",
    description:
      "A minimal, clean globe that puts the focus on the project pins. No visual noise — just your locations on a white canvas. Great for presentations and embedding on a light-themed website.",
  },
  {
    id: "dark",
    style: "mapbox://styles/mapbox/dark-v11",
    projection: "globe",
    fog: {
      color: "rgb(30, 30, 50)",
      "high-color": "rgb(20, 20, 80)",
      "horizon-blend": 0.03,
      "space-color": "rgb(5, 5, 15)",
      "star-intensity": 0.8,
    },
    pinColor: "typed",
    title: "DARK VIEW",
    subtitle: "Night Mode",
    description:
      "A dramatic dark theme with stars. The project pins pop against the dark background, making each location stand out. Ideal for high-contrast presentations and evening browsing.",
  },
  {
    id: "flat",
    style: "mapbox://styles/mapbox/light-v11",
    projection: "mercator",
    fog: null,
    pinColor: "typed",
    title: "FLAT VIEW",
    subtitle: "Traditional Map",
    description:
      "A standard flat map projection for when you need a familiar, straightforward layout. Easy to read, easy to navigate. Best for zooming into specific regions and seeing project density.",
  },
  {
    id: "nautical",
    style: "mapbox://styles/mapbox/outdoors-v12",
    projection: "mercator",
    fog: null,
    pinColor: "typed",
    title: "NAUTICAL VIEW",
    subtitle: "Terrain & Outdoors",
    description:
      "A topographic style showing terrain, elevation, and natural features. Perfect for showcasing projects in remote or rural areas where geography tells part of the story.",
  },
];

interface ScrollShowcaseProps {
  projects: Project[];
}

export function ScrollShowcase({ projects }: ScrollShowcaseProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeSection, setActiveSection] = useState(0);
  const currentStyleRef = useRef<string>("");
  const spinFrameRef = useRef<number | null>(null);

  const mappable = projects.filter((p) => p.lat && p.lng);

  function buildGeoJSON(color: "brand" | "typed"): GeoJSON.FeatureCollection {
    return {
      type: "FeatureCollection",
      features: mappable.map((p, i) => ({
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: [p.lng!, p.lat!] },
        properties: {
          idx: i,
          color: color === "brand" ? "#cb463a" : getTypeColor(p.type),
        },
      })),
    };
  }

  function setupPins(m: mapboxgl.Map, pinColor: "brand" | "typed") {
    if (m.getLayer("showcase-pins")) m.removeLayer("showcase-pins");
    if (m.getSource("showcase")) m.removeSource("showcase");

    m.addSource("showcase", {
      type: "geojson",
      data: buildGeoJSON(pinColor),
    });

    const isDark =
      currentStyleRef.current.includes("dark") ||
      currentStyleRef.current.includes("satellite");

    m.addLayer({
      id: "showcase-pins",
      type: "circle",
      source: "showcase",
      paint: {
        "circle-radius": 4.5,
        "circle-color": ["get", "color"],
        "circle-stroke-width": 1.5,
        "circle-stroke-color": isDark
          ? "rgba(255,255,255,0.5)"
          : "rgba(255,255,255,0.9)",
        "circle-opacity": 0.9,
      },
    });
  }

  function stopSpin() {
    if (spinFrameRef.current) {
      cancelAnimationFrame(spinFrameRef.current);
      spinFrameRef.current = null;
    }
  }

  function startSpin() {
    stopSpin();
    const spin = () => {
      if (!map.current) return;
      const center = map.current.getCenter();
      center.lng += 0.025;
      map.current.jumpTo({ center });
      spinFrameRef.current = requestAnimationFrame(spin);
    };
    spin();
  }

  function applySection(m: mapboxgl.Map, section: Section) {
    if (!m.isStyleLoaded()) {
      m.once("style.load", () => applySection(m, section));
      return;
    }

    const newStyle = section.style;

    if (newStyle !== currentStyleRef.current) {
      currentStyleRef.current = newStyle;
      m.setStyle(newStyle);
      m.once("style.load", () => {
        m.setProjection(section.projection);
        if (section.fog) m.setFog(section.fog);
        else m.setFog({} as any);
        setupPins(m, section.pinColor);
        startSpin();
      });
    } else {
      m.setProjection(section.projection);
      if (section.fog) m.setFog(section.fog);
      else m.setFog({} as any);

      // Update pin colors if needed
      const source = m.getSource("showcase") as mapboxgl.GeoJSONSource;
      if (source) source.setData(buildGeoJSON(section.pinColor));
      startSpin();
    }
  }

  // Init map
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) return;
    mapboxgl.accessToken = token;

    const m = new mapboxgl.Map({
      container: mapContainer.current,
      style: SECTIONS[0].style,
      center: [20, 5],
      zoom: 1.8,
      minZoom: 1.8,
      maxZoom: 1.8,
      projection: "globe",
      interactive: false,
      attributionControl: false,
    });

    currentStyleRef.current = SECTIONS[0].style;

    m.on("load", () => {
      if (SECTIONS[0].fog) m.setFog(SECTIONS[0].fog);
      setupPins(m, SECTIONS[0].pinColor);
      startSpin();
    });

    map.current = m;

    return () => {
      if (spinFrameRef.current) cancelAnimationFrame(spinFrameRef.current);
      m.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Intersection observer
  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    sectionRefs.current.forEach((ref, i) => {
      if (!ref) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveSection(i);
            if (map.current) {
              applySection(map.current, SECTIONS[i]);
            }
          }
        },
        { threshold: 0.5 }
      );
      observer.observe(ref);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ position: "relative" }}>
      {/* Fixed logo — top left */}
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        style={{
          position: "fixed",
          top: 16,
          left: 20,
          zIndex: 10,
          cursor: "pointer",
          filter: "drop-shadow(0 0 10px rgba(255,255,255,1)) drop-shadow(0 0 25px rgba(255,255,255,0.8)) drop-shadow(0 0 50px rgba(255,255,255,0.6)) drop-shadow(0 0 80px rgba(255,255,255,0.4))",
        }}
      >
        <img
          src="/cfc-logo.png"
          alt="Construction for Change"
          style={{ width: "140px", height: "auto" }}
        />
      </a>

      {/* Fixed map background */}
      <div
        ref={mapContainer}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
          pointerEvents: "none",
        }}
      />

      {/* Sections */}
      {SECTIONS.map((section, i) => (
        <div
          key={section.id}
          ref={(el) => { sectionRefs.current[i] = el; }}
          style={{
            position: "relative",
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "0 24px",
            zIndex: 1,
          }}
        >
          {/* Overlay */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background:
                section.id === "light" || section.id === "flat" || section.id === "nautical"
                  ? "rgba(255,255,255,0.35)"
                  : "rgba(5, 5, 20, 0.4)",
              zIndex: 0,
              transition: "background 0.5s",
            }}
          />

          {/* Content */}
          <div
            style={{
              position: "relative",
              zIndex: 1,
              maxWidth: "700px",
              opacity: activeSection === i ? 1 : 0,
              transform: activeSection === i ? "translateY(0)" : "translateY(30px)",
              transition: "opacity 0.6s ease, transform 0.6s ease",
            }}
          >
            {section.subtitle && (
              <p
                style={{
                  fontFamily: "var(--font-oswald), Oswald, sans-serif",
                  fontSize: "12px",
                  fontWeight: 400,
                  letterSpacing: "3px",
                  textTransform: "uppercase",
                  color:
                    section.id === "light" || section.id === "flat" || section.id === "nautical"
                      ? "rgba(55,72,89,0.7)"
                      : "rgba(255,255,255,0.5)",
                  textShadow: "0 0 20px rgba(255,255,255,0.7), 0 0 40px rgba(255,255,255,0.5), 0 0 60px rgba(255,255,255,0.3)",
                  marginBottom: "12px",
                }}
              >
                {section.subtitle}
              </p>
            )}

            <h2
              style={{
                fontFamily: "var(--font-lato), Lato, sans-serif",
                fontSize: "clamp(28px, 4.5vw, 48px)",
                fontWeight: 900,
                color:
                  section.id === "light" || section.id === "flat" || section.id === "nautical"
                    ? "#374859"
                    : "white",
                letterSpacing: "1.5px",
                lineHeight: 1.15,
                margin: "0 0 20px",
                textShadow: "0 0 20px rgba(255,255,255,0.7), 0 0 40px rgba(255,255,255,0.5), 0 0 60px rgba(255,255,255,0.3)",
              }}
            >
              {section.title}
            </h2>

            {section.description && (
              <p
                style={{
                  fontFamily: "var(--font-lato), Lato, sans-serif",
                  fontSize: "clamp(15px, 1.8vw, 18px)",
                  fontWeight: 300,
                  color:
                    section.id === "light" || section.id === "flat" || section.id === "nautical"
                      ? "rgba(55,72,89,0.8)"
                      : "rgba(255,255,255,0.8)",
                  lineHeight: 1.65,
                  margin: "0 0 32px",
                  textShadow: "0 0 20px rgba(255,255,255,0.7), 0 0 40px rgba(255,255,255,0.5), 0 0 60px rgba(255,255,255,0.3)",
                }}
              >
                {section.description}
              </p>
            )}

            {i === 0 && (
              <div
                style={{
                  display: "flex",
                  gap: "16px",
                  flexWrap: "wrap",
                  justifyContent: "center",
                }}
              >
                <PlaceholderButton className="cfc-btn-primary" label="Explore Our Projects" tooltip="Links to your Projects page when integrated" />
                <PlaceholderButton className="cfc-btn-secondary" label="Our Story" tooltip="Links to your About page when integrated" />
              </div>
            )}

          </div>

          {/* Scroll indicator on first section */}
          {i === 0 && (
            <div
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
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  color: "rgba(255,255,255,0.4)",
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                }}
              >
                Scroll
              </span>
              <div
                style={{
                  width: "24px",
                  height: "38px",
                  borderRadius: "12px",
                  border: "2px solid rgba(255,255,255,0.25)",
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
                    background: "rgba(255,255,255,0.4)",
                    animation: "scrollBounce 1.5s ease-in-out infinite",
                  }}
                />
              </div>
            </div>
          )}

          {/* Section dots nav */}
          <div
            style={{
              position: "absolute",
              right: 20,
              top: "50%",
              transform: "translateY(-50%)",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              zIndex: 3,
            }}
          >
            {SECTIONS.map((s, j) => (
              <div
                key={s.id}
                style={{
                  width: activeSection === j ? 10 : 6,
                  height: activeSection === j ? 10 : 6,
                  borderRadius: "50%",
                  background:
                    activeSection === j
                      ? "#cb463a"
                      : "rgba(255,255,255,0.3)",
                  transition: "all 0.3s",
                  cursor: "pointer",
                }}
                onClick={() => {
                  sectionRefs.current[j]?.scrollIntoView({ behavior: "smooth" });
                }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function PlaceholderButton({ className, label, tooltip }: { className: string; label: string; tooltip: string }) {
  const [showTip, setShowTip] = useState(false);

  return (
    <span
      className={className}
      style={{ cursor: "help", position: "relative" }}
      onClick={(e) => { e.preventDefault(); setShowTip(true); setTimeout(() => setShowTip(false), 3000); }}
      onMouseEnter={() => setShowTip(true)}
      onMouseLeave={() => setShowTip(false)}
    >
      {label}
      <span style={{ marginLeft: "8px", opacity: 0.7, fontSize: "12px" }}>&#9998;</span>
      {showTip && (
        <span
          style={{
            position: "absolute",
            bottom: "calc(100% + 10px)",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(0,0,0,0.85)",
            color: "white",
            padding: "8px 14px",
            borderRadius: "8px",
            fontSize: "12px",
            fontWeight: 400,
            whiteSpace: "nowrap",
            textTransform: "none",
            letterSpacing: "0",
            pointerEvents: "none",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          }}
        >
          {tooltip}
        </span>
      )}
    </span>
  );
}
