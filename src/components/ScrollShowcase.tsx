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
    title: "BUILDING FOR COMMUNITIES WORLDWIDE",
    subtitle: "Construction for Change",
    description:
      "Since 2008, we have partnered with organizations across 22 countries to deliver schools, clinics, and community infrastructure where it is needed most.",
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
    title: "129 PROJECTS DELIVERED",
    subtitle: "Earth View",
    description:
      "From health clinics in rural Togo to solar installations across Puerto Rico, every pin represents a community transformed through better infrastructure.",
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
    title: "23 COUNTRIES",
    subtitle: "Light View",
    description:
      "Our work spans Africa, Asia, the Caribbean, and the Americas. We bring professional construction management to organizations that build schools, clinics, and community centers.",
  },
  {
    id: "flat",
    style: "mapbox://styles/mapbox/light-v11",
    projection: "mercator",
    fog: null,
    pinColor: "typed",
    title: "HEALTHCARE, EDUCATION, HOUSING & MORE",
    subtitle: "Flat View",
    description:
      "49 healthcare facilities. 30 education buildings. 17 housing projects. 16 solar installations. Each one built to last, designed with the community, managed with care.",
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
    title: "THE WORK CONTINUES",
    subtitle: "Dark View",
    description:
      "With active projects across multiple continents, we are always building. Explore the interactive map below to see where we have been and where we are going.",
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

  function startSpin() {
    const spin = () => {
      if (!map.current) return;
      const center = map.current.getCenter();
      center.lng += 0.008;
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
      });
    } else {
      m.setProjection(section.projection);
      if (section.fog) m.setFog(section.fog);
      else m.setFog({} as any);

      // Update pin colors if needed
      const source = m.getSource("showcase") as mapboxgl.GeoJSONSource;
      if (source) source.setData(buildGeoJSON(section.pinColor));
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
          filter: "drop-shadow(0 0 12px rgba(255,255,255,0.4)) drop-shadow(0 0 30px rgba(255,255,255,0.15))",
        }}
      >
        <img
          src="/cfc-logo.png"
          alt="Construction for Change"
          style={{ width: "70px", height: "auto" }}
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
                section.id === "light" || section.id === "flat"
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
            <p
              style={{
                fontFamily: "var(--font-oswald), Oswald, sans-serif",
                fontSize: "12px",
                fontWeight: 400,
                letterSpacing: "3px",
                textTransform: "uppercase",
                color:
                  section.id === "light" || section.id === "flat"
                    ? "rgba(55,72,89,0.7)"
                    : "rgba(255,255,255,0.5)",
                marginBottom: "12px",
              }}
            >
              {section.subtitle}
            </p>

            <h2
              style={{
                fontFamily: "var(--font-lato), Lato, sans-serif",
                fontSize: "clamp(28px, 4.5vw, 48px)",
                fontWeight: 900,
                color:
                  section.id === "light" || section.id === "flat"
                    ? "#374859"
                    : "white",
                letterSpacing: "1.5px",
                lineHeight: 1.15,
                margin: "0 0 20px",
                textShadow:
                  section.id === "light" || section.id === "flat"
                    ? "none"
                    : "0 2px 20px rgba(0,0,0,0.4)",
              }}
            >
              {section.title}
            </h2>

            <p
              style={{
                fontFamily: "var(--font-lato), Lato, sans-serif",
                fontSize: "clamp(15px, 1.8vw, 18px)",
                fontWeight: 300,
                color:
                  section.id === "light" || section.id === "flat"
                    ? "rgba(55,72,89,0.8)"
                    : "rgba(255,255,255,0.8)",
                lineHeight: 1.65,
                margin: "0 0 32px",
                textShadow:
                  section.id === "light" || section.id === "flat"
                    ? "none"
                    : "0 1px 10px rgba(0,0,0,0.3)",
              }}
            >
              {section.description}
            </p>

            {i === 0 && (
              <div
                style={{
                  display: "flex",
                  gap: "16px",
                  flexWrap: "wrap",
                  justifyContent: "center",
                }}
              >
                <a
                  href="https://www.constructionforchange.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: "#cb463a",
                    color: "white",
                    padding: "14px 32px",
                    borderRadius: "6px",
                    fontSize: "14px",
                    fontWeight: 900,
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    textDecoration: "none",
                  }}
                >
                  Explore Our Projects
                </a>
                <a
                  href="https://www.constructionforchange.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: "transparent",
                    color: "white",
                    padding: "14px 32px",
                    borderRadius: "0",
                    fontSize: "14px",
                    fontWeight: 400,
                    fontFamily: "var(--font-oswald), Oswald, sans-serif",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    textDecoration: "none",
                    border: "2px solid #cb463a",
                  }}
                >
                  Our Story
                </a>
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
