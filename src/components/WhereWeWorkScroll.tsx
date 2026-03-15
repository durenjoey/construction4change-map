"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Hub } from "@/lib/hubs";

const HUB_VIEWS: Record<string, { center: [number, number]; zoom: number }> = {
  intro: { center: [20, 10], zoom: 1.8 },
  "north-america": { center: [-98, 40], zoom: 3.8 },
  "latin-caribbean": { center: [-68, 17], zoom: 3.5 },
  "west-africa": { center: [-2, 9], zoom: 4.2 },
  "east-south-africa": { center: [32, -3], zoom: 3.8 },
  "asia-pacific": { center: [90, 15], zoom: 3.5 },
  outro: { center: [20, 10], zoom: 1.8 },
};

interface Props {
  hubs: Hub[];
}

export function WhereWeWorkScroll({ hubs }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [mapReady, setMapReady] = useState(false);

  const sections = [
    { id: "intro", hub: null },
    ...hubs.map((h) => ({ id: h.id, hub: h })),
    { id: "outro", hub: null },
  ];

  function setupLayers(mapInstance: mapboxgl.Map) {
    if (mapInstance.getSource("country-boundaries")) return;

    mapInstance.addSource("country-boundaries", {
      type: "vector",
      url: "mapbox://mapbox.country-boundaries-v1",
    });

    const layers = mapInstance.getStyle().layers || [];
    let insertBefore: string | undefined;
    for (const layer of layers) {
      if (layer.type === "symbol") {
        insertBefore = layer.id;
        break;
      }
    }

    const coverageMatch: any[] = ["match", ["get", "iso_3166_1_alpha_3"]];
    for (const hub of hubs) {
      for (const code of hub.coverageIsoCodes) {
        coverageMatch.push(code, hub.lightColor);
      }
    }
    coverageMatch.push("rgba(0,0,0,0)");

    const activeMatch: any[] = ["match", ["get", "iso_3166_1_alpha_3"]];
    for (const hub of hubs) {
      for (const code of hub.activeIsoCodes) {
        activeMatch.push(code, hub.color);
      }
    }
    activeMatch.push("rgba(0,0,0,0)");

    mapInstance.addLayer(
      {
        id: "hub-coverage-fill",
        type: "fill",
        source: "country-boundaries",
        "source-layer": "country_boundaries",
        paint: { "fill-color": coverageMatch as any, "fill-opacity": 0.35 },
      },
      insertBefore
    );

    mapInstance.addLayer(
      {
        id: "hub-active-fill",
        type: "fill",
        source: "country-boundaries",
        "source-layer": "country_boundaries",
        paint: { "fill-color": activeMatch as any, "fill-opacity": 0.5 },
      },
      insertBefore
    );

    mapInstance.addLayer(
      {
        id: "hub-active-border",
        type: "line",
        source: "country-boundaries",
        "source-layer": "country_boundaries",
        paint: {
          "line-color": activeMatch as any,
          "line-width": 1.5,
          "line-opacity": 0.7,
        },
      },
      insertBefore
    );
  }

  function showSection(mapInstance: mapboxgl.Map, sectionId: string) {
    const view = HUB_VIEWS[sectionId];
    if (!view) return;

    const hub = hubs.find((h) => h.id === sectionId);

    if (sectionId === "intro" || sectionId === "outro" || !hub) {
      // Show all hubs
      const coverageMatch: any[] = ["match", ["get", "iso_3166_1_alpha_3"]];
      for (const h of hubs) {
        for (const code of h.coverageIsoCodes) {
          coverageMatch.push(code, h.lightColor);
        }
      }
      coverageMatch.push("rgba(0,0,0,0)");

      const activeMatch: any[] = ["match", ["get", "iso_3166_1_alpha_3"]];
      for (const h of hubs) {
        for (const code of h.activeIsoCodes) {
          activeMatch.push(code, h.color);
        }
      }
      activeMatch.push("rgba(0,0,0,0)");

      mapInstance.setPaintProperty("hub-coverage-fill", "fill-color", coverageMatch as any);
      mapInstance.setPaintProperty("hub-active-fill", "fill-color", activeMatch as any);
    } else {
      // Focus single hub
      const coverageMatch: any[] = ["match", ["get", "iso_3166_1_alpha_3"]];
      for (const code of hub.coverageIsoCodes) {
        coverageMatch.push(code, hub.lightColor);
      }
      coverageMatch.push("rgba(245,245,245,0.4)");

      const activeMatch: any[] = ["match", ["get", "iso_3166_1_alpha_3"]];
      for (const code of hub.activeIsoCodes) {
        activeMatch.push(code, hub.color);
      }
      activeMatch.push("rgba(0,0,0,0)");

      mapInstance.setPaintProperty("hub-coverage-fill", "fill-color", coverageMatch as any);
      mapInstance.setPaintProperty("hub-active-fill", "fill-color", activeMatch as any);
    }

    mapInstance.flyTo({ ...view, duration: 1500, essential: true });
  }

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) return;
    mapboxgl.accessToken = token;

    const mapInstance = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [20, 10],
      zoom: 1.8,
      minZoom: 1.5,
      maxZoom: 10,
      projection: "mercator",
      interactive: false,
      attributionControl: false,
    });

    mapInstance.on("load", () => {
      setupLayers(mapInstance);
      setMapReady(true);
    });

    map.current = mapInstance;
    return () => {
      mapInstance.remove();
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
            setActiveIdx(i);
            if (map.current && mapReady) {
              showSection(map.current, sections[i].id);
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
  }, [mapReady]);

  return (
    <div style={{ position: "relative", marginTop: "48px" }}>
      {/* Fixed map background */}
      <div
        ref={mapContainer}
        style={{
          position: "fixed",
          top: "48px",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
        }}
      />

      {/* Scroll sections */}
      {sections.map((section, i) => {
        const hub = section.hub;
        const isIntro = section.id === "intro";
        const isOutro = section.id === "outro";
        const isActive = activeIdx === i;

        return (
          <div
            key={section.id}
            ref={(el) => {
              sectionRefs.current[i] = el;
            }}
            style={{
              position: "relative",
              height: "100vh",
              display: "flex",
              alignItems: isIntro || isOutro ? "center" : "center",
              justifyContent: isIntro || isOutro ? "center" : "flex-start",
              padding: "0 24px",
              zIndex: 1,
              pointerEvents: "none",
            }}
          >
            {/* Content card */}
            <div
              style={{
                pointerEvents: "auto",
                maxWidth: isIntro || isOutro ? "600px" : "400px",
                marginLeft: isIntro || isOutro ? "auto" : "40px",
                marginRight: isIntro || isOutro ? "auto" : undefined,
                background: "rgba(255,255,255,0.95)",
                borderRadius: "16px",
                padding: isIntro || isOutro ? "48px 40px" : "32px 28px",
                boxShadow: "0 8px 40px rgba(0,0,0,0.12)",
                border: hub
                  ? `2px solid ${hub.color}30`
                  : "1px solid #d6d6d6",
                opacity: isActive ? 1 : 0,
                transform: isActive ? "translateY(0)" : "translateY(30px)",
                transition: "opacity 0.6s ease, transform 0.6s ease",
                textAlign: isIntro || isOutro ? "center" : "left",
                backdropFilter: "blur(8px)",
                fontFamily: "var(--font-lato), Lato, sans-serif",
              }}
            >
              {isIntro && (
                <>
                  <h1
                    style={{
                      fontSize: "32px",
                      fontWeight: 900,
                      color: "#374859",
                      margin: "0 0 12px",
                      letterSpacing: "1px",
                    }}
                  >
                    WHERE WE WORK
                  </h1>
                  <p
                    style={{
                      fontSize: "16px",
                      color: "#666",
                      margin: "0 0 20px",
                      lineHeight: 1.6,
                    }}
                  >
                    Construction for Change operates through five regional hubs,
                    providing professional construction management to
                    partners all over the planet.
                  </p>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "#999",
                      margin: 0,
                      letterSpacing: "1px",
                      textTransform: "uppercase",
                    }}
                  >
                    Scroll to explore each region &darr;
                  </p>
                </>
              )}

              {isOutro && (
                <>
                  <h2
                    style={{
                      fontSize: "28px",
                      fontWeight: 900,
                      color: "#374859",
                      margin: "0 0 12px",
                    }}
                  >
                    HAVE A PROJECT IN MIND?
                  </h2>
                  <p
                    style={{
                      fontSize: "15px",
                      color: "#666",
                      margin: "0 0 24px",
                      lineHeight: 1.6,
                    }}
                  >
                    Whether you&rsquo;re an NGO, government agency, or community
                    organization &mdash; we provide professional construction
                    management to help you build.
                  </p>
                  <a
                    href="https://www.constructionforchange.org/contact"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cfc-btn-primary"
                    style={{
                      display: "inline-block",
                      textDecoration: "none",
                    }}
                  >
                    Get In Touch
                  </a>
                </>
              )}

              {hub && (
                <>
                  {/* Color accent */}
                  <div
                    style={{
                      width: "40px",
                      height: "4px",
                      borderRadius: "2px",
                      background: hub.color,
                      marginBottom: "16px",
                    }}
                  />
                  <h2
                    style={{
                      fontSize: "24px",
                      fontWeight: 700,
                      color: "#374859",
                      margin: "0 0 4px",
                    }}
                  >
                    {hub.name}
                  </h2>
                  <div
                    style={{
                      fontSize: "13px",
                      color: hub.color,
                      fontWeight: 700,
                      marginBottom: "12px",
                    }}
                  >
                    {hub.projectCount} projects &middot;{" "}
                    {hub.activeCountries.length} countries
                  </div>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#666",
                      lineHeight: 1.6,
                      margin: "0 0 16px",
                    }}
                  >
                    {hub.description}
                  </p>

                  {/* Countries */}
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "6px",
                      marginBottom: "16px",
                    }}
                  >
                    {hub.activeCountries.map((c) => (
                      <span
                        key={c}
                        style={{
                          fontSize: "11px",
                          padding: "3px 10px",
                          borderRadius: "9999px",
                          background: hub.lightColor,
                          color: hub.color,
                          fontWeight: 600,
                        }}
                      >
                        {c}
                      </span>
                    ))}
                  </div>

                  {/* Highlights */}
                  {hub.highlights.map((h, j) => (
                    <div
                      key={j}
                      style={{
                        fontSize: "13px",
                        color: "#555",
                        lineHeight: 1.5,
                        marginBottom: "4px",
                        paddingLeft: "14px",
                        position: "relative",
                      }}
                    >
                      <span
                        style={{
                          position: "absolute",
                          left: 0,
                          color: hub.color,
                          fontWeight: 700,
                        }}
                      >
                        &bull;
                      </span>
                      {h}
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Nav dots */}
            <div
              style={{
                position: "absolute",
                right: 20,
                top: "50%",
                transform: "translateY(-50%)",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                zIndex: 3,
                pointerEvents: "auto",
              }}
            >
              {sections.map((s, j) => (
                <div
                  key={s.id}
                  style={{
                    width: activeIdx === j ? 10 : 6,
                    height: activeIdx === j ? 10 : 6,
                    borderRadius: "50%",
                    background:
                      activeIdx === j
                        ? s.hub?.color || "#374859"
                        : "rgba(55,72,89,0.3)",
                    transition: "all 0.3s",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    sectionRefs.current[j]?.scrollIntoView({
                      behavior: "smooth",
                    });
                  }}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
