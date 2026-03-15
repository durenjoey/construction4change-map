"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Hub } from "@/lib/hubs";

// Region centers for fly-to
const HUB_CENTERS: Record<string, { center: [number, number]; zoom: number }> = {
  "north-america": { center: [-98, 40], zoom: 3.5 },
  "latin-caribbean": { center: [-68, 17], zoom: 3.2 },
  "west-africa": { center: [-5, 9], zoom: 4 },
  "east-south-africa": { center: [32, -5], zoom: 3.5 },
  "asia-pacific": { center: [90, 15], zoom: 3.2 },
};

interface Props {
  hubs: Hub[];
}

export function WhereWeWorkSplit({ hubs }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [selectedHub, setSelectedHub] = useState<string>(hubs[0].id);

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

    // All coverage (light)
    const coverageMatch: any[] = ["match", ["get", "iso_3166_1_alpha_3"]];
    for (const hub of hubs) {
      for (const code of hub.coverageIsoCodes) {
        coverageMatch.push(code, hub.lightColor);
      }
    }
    coverageMatch.push("rgba(0,0,0,0)");

    // Active countries (hub color)
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

  function focusHub(mapInstance: mapboxgl.Map, hubId: string) {
    const hub = hubs.find((h) => h.id === hubId)!;
    const target = HUB_CENTERS[hubId];

    // Highlight only selected hub
    const coverageMatch: any[] = ["match", ["get", "iso_3166_1_alpha_3"]];
    for (const code of hub.coverageIsoCodes) {
      coverageMatch.push(code, hub.lightColor);
    }
    coverageMatch.push("rgba(245,245,245,0.5)");

    const activeMatch: any[] = ["match", ["get", "iso_3166_1_alpha_3"]];
    for (const code of hub.activeIsoCodes) {
      activeMatch.push(code, hub.color);
    }
    activeMatch.push("rgba(0,0,0,0)");

    mapInstance.setPaintProperty("hub-coverage-fill", "fill-color", coverageMatch);
    mapInstance.setPaintProperty("hub-coverage-fill", "fill-opacity", 0.45);
    mapInstance.setPaintProperty("hub-active-fill", "fill-color", activeMatch);
    mapInstance.setPaintProperty("hub-active-fill", "fill-opacity", 0.6);
    mapInstance.setPaintProperty("hub-active-border", "line-color", activeMatch);

    if (target) {
      mapInstance.flyTo({ ...target, duration: 1200, essential: true });
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
      center: [-98, 40],
      zoom: 3.5,
      minZoom: 1.5,
      maxZoom: 10,
      projection: "mercator",
      attributionControl: false,
    });

    mapInstance.on("load", () => {
      setupLayers(mapInstance);
      setMapReady(true);
      focusHub(mapInstance, hubs[0].id);
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
    focusHub(map.current, selectedHub);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedHub, mapReady]);

  const hub = hubs.find((h) => h.id === selectedHub)!;

  return (
    <div
      style={{
        display: "flex",
        height: "calc(100vh - 48px)",
        marginTop: "48px",
        fontFamily: "var(--font-lato), Lato, sans-serif",
      }}
    >
      {/* Map */}
      <div ref={mapContainer} style={{ flex: 1, minWidth: 0 }} />

      {/* Sidebar */}
      <div
        style={{
          width: "420px",
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          borderLeft: "1px solid #d6d6d6",
          background: "white",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "70px 24px 20px",
            background: "#374859",
            color: "white",
          }}
        >
          <h1
            style={{
              fontSize: "24px",
              fontWeight: 900,
              letterSpacing: "1px",
              margin: "0 0 6px",
            }}
          >
            WHERE WE WORK
          </h1>
          <p
            style={{
              fontSize: "14px",
              fontWeight: 300,
              color: "rgba(255,255,255,0.6)",
              margin: 0,
            }}
          >
            5 hubs &middot; all over the planet &middot; Click a region to explore
          </p>
        </div>

        {/* Hub tabs */}
        <div
          style={{
            display: "flex",
            overflowX: "auto",
            borderBottom: "1px solid #e8e8e8",
            background: "#faf9f5",
          }}
          className="no-scrollbar"
        >
          {hubs.map((h) => (
            <button
              key={h.id}
              onClick={() => setSelectedHub(h.id)}
              style={{
                padding: "12px 16px",
                fontSize: "12px",
                fontWeight: 700,
                border: "none",
                borderBottom: `3px solid ${selectedHub === h.id ? h.color : "transparent"}`,
                background: "transparent",
                color: selectedHub === h.id ? h.color : "#999",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.2s",
                fontFamily: "inherit",
              }}
            >
              {h.shortName}
            </button>
          ))}
        </div>

        {/* Hub detail */}
        <div style={{ padding: "24px", flex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "16px",
            }}
          >
            <span
              style={{
                width: 16,
                height: 16,
                borderRadius: "4px",
                background: hub.color,
                display: "inline-block",
              }}
            />
            <h2
              style={{
                fontSize: "22px",
                fontWeight: 700,
                color: "#374859",
                margin: 0,
              }}
            >
              {hub.name}
            </h2>
          </div>

          <p
            style={{
              fontSize: "14px",
              color: "#666",
              lineHeight: 1.7,
              margin: "0 0 20px",
            }}
          >
            {hub.description}
          </p>

          {/* Stats row */}
          <div
            style={{
              display: "flex",
              gap: "16px",
              marginBottom: "20px",
              padding: "12px 16px",
              background: "#faf9f5",
              borderRadius: "8px",
            }}
          >
            <div>
              <span
                style={{ fontSize: "22px", fontWeight: 900, color: hub.color }}
              >
                {hub.projectCount}
              </span>
              <span
                style={{
                  fontSize: "11px",
                  color: "#999",
                  display: "block",
                }}
              >
                Projects
              </span>
            </div>
            <div>
              <span
                style={{ fontSize: "22px", fontWeight: 900, color: hub.color }}
              >
                {hub.activeCountries.length}
              </span>
              <span
                style={{
                  fontSize: "11px",
                  color: "#999",
                  display: "block",
                }}
              >
                Countries
              </span>
            </div>
          </div>

          {/* Countries */}
          <div style={{ marginBottom: "20px" }}>
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
                    padding: "4px 12px",
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
          </div>

          {/* Highlights */}
          <div style={{ marginBottom: "24px" }}>
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
            {hub.highlights.map((h, i) => (
              <div
                key={i}
                style={{
                  fontSize: "13px",
                  color: "#555",
                  lineHeight: 1.5,
                  marginBottom: "6px",
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
          </div>
        </div>

        {/* CTA */}
        <div
          style={{
            padding: "20px 24px",
            borderTop: "1px solid #e8e8e8",
            background: "#faf9f5",
          }}
        >
          <p
            style={{
              fontSize: "13px",
              color: "#666",
              margin: "0 0 12px",
              lineHeight: 1.5,
            }}
          >
            Have a project in this region? We provide professional
            construction management to help you build.
          </p>
          <a
            href="https://www.constructionforchange.org/contact"
            target="_blank"
            rel="noopener noreferrer"
            className="cfc-btn-primary"
            style={{
              display: "block",
              textAlign: "center",
              textDecoration: "none",
              fontSize: "13px",
              padding: "12px 24px",
            }}
          >
            Get In Touch
          </a>
        </div>
      </div>
    </div>
  );
}
