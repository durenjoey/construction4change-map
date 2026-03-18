"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Hub } from "@/lib/hubs";

const HUB_CENTERS: Record<string, { center: [number, number]; zoom: number }> = {
  "north-america": { center: [-122.3, 47.6], zoom: 4 },
  "latin-caribbean": { center: [-70, 18], zoom: 3.5 },
  "west-africa": { center: [-5, 8], zoom: 4 },
  "east-south-africa": { center: [32, -2], zoom: 3.5 },
  "asia-pacific": { center: [85, 20], zoom: 3.2 },
};

interface Props {
  hubs: Hub[];
}

export function WhereWeWorkMapCards({ hubs }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [activeHub, setActiveHub] = useState<string | null>(null);

  function setupLayers(mapInstance: mapboxgl.Map) {
    if (mapInstance.getSource("country-boundaries")) return;

    mapInstance.addSource("country-boundaries", {
      type: "vector",
      url: "mapbox://mapbox.country-boundaries-v1",
    });

    // Find first symbol layer
    const layers = mapInstance.getStyle().layers || [];
    let insertBefore: string | undefined;
    for (const layer of layers) {
      if (layer.type === "symbol") {
        insertBefore = layer.id;
        break;
      }
    }

    // Build match expression for coverage countries (lighter shade)
    const coverageMatch: any[] = ["match", ["get", "iso_3166_1_alpha_3"]];
    for (const hub of hubs) {
      for (const code of hub.coverageIsoCodes) {
        coverageMatch.push(code, hub.lightColor);
      }
    }
    coverageMatch.push("rgba(0,0,0,0)");

    // Build match expression for active countries (hub color)
    const activeMatch: any[] = ["match", ["get", "iso_3166_1_alpha_3"]];
    for (const hub of hubs) {
      for (const code of hub.activeIsoCodes) {
        activeMatch.push(code, hub.color);
      }
    }
    activeMatch.push("rgba(0,0,0,0)");

    // Coverage fill (broader region, lighter)
    mapInstance.addLayer(
      {
        id: "hub-coverage-fill",
        type: "fill",
        source: "country-boundaries",
        "source-layer": "country_boundaries",
        paint: {
          "fill-color": coverageMatch as any,
          "fill-opacity": 0.35,
        },
      },
      insertBefore
    );

    // Active country fill (darker, on top)
    mapInstance.addLayer(
      {
        id: "hub-active-fill",
        type: "fill",
        source: "country-boundaries",
        "source-layer": "country_boundaries",
        paint: {
          "fill-color": activeMatch as any,
          "fill-opacity": 0.5,
        },
      },
      insertBefore
    );

    // Border for active countries
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

  function highlightHub(mapInstance: mapboxgl.Map, hubId: string | null) {
    if (!mapInstance.getLayer("hub-coverage-fill")) return;

    if (!hubId) {
      // Show all hubs
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

      mapInstance.setPaintProperty("hub-coverage-fill", "fill-color", coverageMatch as any);
      mapInstance.setPaintProperty("hub-coverage-fill", "fill-opacity", 0.35);
      mapInstance.setPaintProperty("hub-active-fill", "fill-color", activeMatch as any);
      mapInstance.setPaintProperty("hub-active-fill", "fill-opacity", 0.5);
      mapInstance.setPaintProperty("hub-active-border", "line-color", activeMatch as any);
    } else {
      const hub = hubs.find((h) => h.id === hubId)!;

      // Dim everything except selected hub
      const coverageMatch: any[] = ["match", ["get", "iso_3166_1_alpha_3"]];
      for (const code of hub.coverageIsoCodes) {
        coverageMatch.push(code, hub.lightColor);
      }
      coverageMatch.push("rgba(0,0,0,0)");

      const activeMatch: any[] = ["match", ["get", "iso_3166_1_alpha_3"]];
      for (const code of hub.activeIsoCodes) {
        activeMatch.push(code, hub.color);
      }
      activeMatch.push("rgba(0,0,0,0)");

      mapInstance.setPaintProperty("hub-coverage-fill", "fill-color", coverageMatch as any);
      mapInstance.setPaintProperty("hub-coverage-fill", "fill-opacity", 0.5);
      mapInstance.setPaintProperty("hub-active-fill", "fill-color", activeMatch as any);
      mapInstance.setPaintProperty("hub-active-fill", "fill-opacity", 0.65);
      mapInstance.setPaintProperty("hub-active-border", "line-color", activeMatch as any);
    }
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
      maxZoom: 8,
      projection: "mercator",
      attributionControl: false,
    });

    mapInstance.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      "top-right"
    );

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

  useEffect(() => {
    if (!map.current || !mapReady) return;
    highlightHub(map.current, activeHub);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeHub, mapReady]);

  function selectHub(hubId: string) {
    const isMobile = window.innerWidth < 768;
    if (activeHub === hubId) {
      setActiveHub(null);
      if (map.current) {
        map.current.flyTo({ center: [20, 10], zoom: 1.8, duration: 1200 });
      }
    } else {
      setActiveHub(hubId);
      const target = HUB_CENTERS[hubId];
      if (target && map.current) {
        map.current.flyTo({ ...target, duration: 1200, essential: true });
      }
      if (isMobile && mapContainer.current) {
        mapContainer.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }

  return (
    <div>
      {/* Hero */}
      <div
        style={{
          background: "#374859",
          padding: "80px 24px 24px",
          marginTop: "48px",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-lato), Lato, sans-serif",
            fontSize: "clamp(28px, 4vw, 42px)",
            fontWeight: 900,
            color: "white",
            letterSpacing: "1px",
            margin: "0 0 12px",
          }}
        >
          WHERE WE WORK
        </h1>
        <p
          style={{
            fontFamily: "var(--font-lato), Lato, sans-serif",
            fontSize: "16px",
            fontWeight: 300,
            color: "rgba(255,255,255,0.7)",
            maxWidth: "600px",
            margin: "0 auto",
            lineHeight: 1.6,
          }}
        >
          Five regional hubs all over the planet. If you have a project that
          needs construction management, we&rsquo;d love to hear from you.
        </p>
      </div>

      {/* Map */}
      <div
        ref={mapContainer}
        style={{ width: "100%", height: "50vh", minHeight: "400px" }}
      />

      {/* Legend bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          flexWrap: "wrap",
          gap: "16px",
          padding: "16px 24px",
          background: "#faf9f5",
          borderBottom: "1px solid #e8e8e8",
        }}
      >
        {hubs.map((hub) => (
          <button
            key={hub.id}
            onClick={() => selectHub(hub.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 12px",
              borderRadius: "6px",
              border: `2px solid ${activeHub === hub.id ? hub.color : "transparent"}`,
              background: activeHub === hub.id ? hub.lightColor : "transparent",
              cursor: "pointer",
              transition: "all 0.2s",
              fontFamily: "var(--font-lato), Lato, sans-serif",
            }}
          >
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: "3px",
                background: hub.color,
                display: "inline-block",
              }}
            />
            <span
              style={{ fontSize: "13px", fontWeight: 600, color: "#374859" }}
            >
              {hub.shortName}
            </span>
            <span style={{ fontSize: "11px", color: "#999" }}>
              ({hub.projectCount})
            </span>
          </button>
        ))}
      </div>

      {/* Hub cards grid */}
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "40px 24px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
          gap: "24px",
        }}
      >
        {hubs.map((hub) => (
          <div
            key={hub.id}
            onClick={() => selectHub(hub.id)}
            style={{
              cursor: "pointer",
              borderRadius: "12px",
              border: `1px solid ${activeHub === hub.id ? hub.color : "#d6d6d6"}`,
              overflow: "hidden",
              transition: "all 0.3s",
              boxShadow:
                activeHub === hub.id
                  ? `0 8px 30px ${hub.color}22`
                  : "0 2px 8px rgba(0,0,0,0.06)",
              transform: activeHub === hub.id ? "translateY(-2px)" : "none",
            }}
          >
            {/* Color bar */}
            <div style={{ height: "5px", background: hub.color }} />

            <div style={{ padding: "24px" }}>
              {/* Header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "12px",
                }}
              >
                <h3
                  style={{
                    fontFamily: "var(--font-lato), Lato, sans-serif",
                    fontSize: "20px",
                    fontWeight: 700,
                    color: "#374859",
                    margin: 0,
                  }}
                >
                  {hub.name}
                </h3>
                <span
                  style={{
                    fontSize: "24px",
                    fontWeight: 900,
                    color: hub.color,
                    fontFamily: "var(--font-lato), Lato, sans-serif",
                    lineHeight: 1,
                  }}
                >
                  {hub.projectCount}
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 400,
                      color: "#999",
                      display: "block",
                      textAlign: "right",
                    }}
                  >
                    projects
                  </span>
                </span>
              </div>

              {/* Description */}
              <p
                style={{
                  fontFamily: "var(--font-lato), Lato, sans-serif",
                  fontSize: "14px",
                  color: "#666",
                  lineHeight: 1.6,
                  margin: "0 0 16px",
                }}
              >
                {hub.description}
              </p>

              {/* Countries */}
              <div style={{ marginBottom: "16px" }}>
                <div
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "1.5px",
                    color: "#999",
                    marginBottom: "8px",
                  }}
                >
                  Active Countries
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {hub.activeCountries.map((c) => (
                    <span
                      key={c}
                      style={{
                        fontSize: "12px",
                        padding: "3px 10px",
                        borderRadius: "9999px",
                        background: hub.lightColor,
                        color: hub.color,
                        fontWeight: 600,
                        fontFamily: "var(--font-lato), Lato, sans-serif",
                      }}
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              {/* Highlights */}
              <div>
                <div
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "1.5px",
                    color: "#999",
                    marginBottom: "8px",
                  }}
                >
                  Highlights
                </div>
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: "16px",
                    listStyle: "none",
                  }}
                >
                  {hub.highlights.map((h, i) => (
                    <li
                      key={i}
                      style={{
                        fontSize: "13px",
                        color: "#555",
                        lineHeight: 1.5,
                        marginBottom: "4px",
                        position: "relative",
                        fontFamily: "var(--font-lato), Lato, sans-serif",
                      }}
                    >
                      <span
                        style={{
                          position: "absolute",
                          left: "-14px",
                          color: hub.color,
                          fontWeight: 700,
                        }}
                      >
                        &bull;
                      </span>
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div
        style={{
          background: "#374859",
          padding: "60px 24px",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-lato), Lato, sans-serif",
            fontSize: "28px",
            fontWeight: 900,
            color: "white",
            margin: "0 0 12px",
          }}
        >
          HAVE A PROJECT IN MIND?
        </h2>
        <p
          style={{
            fontFamily: "var(--font-lato), Lato, sans-serif",
            fontSize: "16px",
            fontWeight: 300,
            color: "rgba(255,255,255,0.7)",
            maxWidth: "500px",
            margin: "0 auto 24px",
            lineHeight: 1.6,
          }}
        >
          Whether you&rsquo;re an NGO, government agency, or community organization,
          we provide professional construction management to help you build.
        </p>
        <a
          href="https://www.constructionforchange.org/contact"
          target="_blank"
          rel="noopener noreferrer"
          className="cfc-btn-primary"
          style={{ display: "inline-block", textDecoration: "none" }}
        >
          Get In Touch
        </a>
      </div>
    </div>
  );
}
