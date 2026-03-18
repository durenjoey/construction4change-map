"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Project } from "@/lib/types";

interface HeroGlobeProps {
  projects: Project[];
}

export function HeroGlobe({ projects }: HeroGlobeProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) return;
    mapboxgl.accessToken = token;

    const mapInstance = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: [20, 5],
      zoom: 1.8,
      minZoom: 1.8,
      maxZoom: 1.8,
      projection: "globe",
      interactive: false,
      attributionControl: false,
    });

    mapInstance.on("load", () => {
      mapInstance.setFog({
        color: "rgb(220, 230, 240)",
        "high-color": "rgb(70, 130, 220)",
        "horizon-blend": 0.03,
        "space-color": "rgb(5, 5, 20)",
        "star-intensity": 0.8,
      });

      const geojson: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features: projects
          .filter((p) => p.lat && p.lng)
          .map((p) => ({
            type: "Feature" as const,
            geometry: {
              type: "Point" as const,
              coordinates: [p.lng!, p.lat!],
            },
            properties: {},
          })),
      };

      mapInstance.addSource("hero-projects", {
        type: "geojson",
        data: geojson,
      });

      mapInstance.addLayer({
        id: "hero-pins",
        type: "circle",
        source: "hero-projects",
        paint: {
          "circle-radius": 4,
          "circle-color": "#cb463a",
          "circle-stroke-width": 1.5,
          "circle-stroke-color": "rgba(255,255,255,0.6)",
          "circle-opacity": 0.9,
        },
      });

      // Spin
      const spin = () => {
        if (!map.current) return;
        const center = map.current.getCenter();
        center.lng += 0.008;
        map.current.jumpTo({ center });
        requestAnimationFrame(spin);
      };
      spin();
    });

    map.current = mapInstance;

    return () => {
      mapInstance.remove();
      map.current = null;
    };
  }, [projects]);

  return (
    <div style={{ position: "relative", height: "100vh", width: "100%", overflow: "hidden" }}>
      {/* Globe background */}
      <div
        ref={mapContainer}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: "none",
        }}
      />

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
          padding: "0 24px",
          pointerEvents: "none",
        }}
      >
        <img
          src="/cfc-logo.png"
          alt="Construction for Change"
          style={{ width: "200px", marginBottom: "32px", filter: "brightness(1.1)" }}
        />
        <h1
          style={{
            fontFamily: "var(--font-lato), Lato, sans-serif",
            fontSize: "clamp(32px, 5vw, 56px)",
            fontWeight: 900,
            color: "white",
            letterSpacing: "2px",
            lineHeight: 1.15,
            margin: "0 0 20px",
            maxWidth: "800px",
            textShadow: "0 2px 20px rgba(0,0,0,0.4)",
          }}
        >
          BUILDING FOR COMMUNITIES WORLDWIDE
        </h1>
        <p
          style={{
            fontFamily: "var(--font-lato), Lato, sans-serif",
            fontSize: "clamp(16px, 2vw, 20px)",
            fontWeight: 300,
            color: "rgba(255,255,255,0.85)",
            maxWidth: "600px",
            lineHeight: 1.6,
            margin: "0 0 40px",
            textShadow: "0 1px 10px rgba(0,0,0,0.3)",
          }}
        >
          Since 2008, we have partnered with organizations across 24 countries to deliver schools, clinics, and community infrastructure where it is needed most.
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
          <a
            href="#map"
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
              transition: "background 0.2s",
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
              transition: "background 0.2s",
            }}
          >
            Our Story
          </a>
        </div>
      </div>

      {/* Scroll indicator */}
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
    </div>
  );
}
