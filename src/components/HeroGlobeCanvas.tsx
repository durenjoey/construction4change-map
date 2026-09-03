"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Project } from "@/lib/types";

interface HeroGlobeCanvasProps {
  projects: Project[];
}

/** Mapbox GL v3 needs WebGL; probe a scratch canvas instead of relying on the removed mapboxgl.supported(). */
function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      canvas.getContext("webgl2") ||
        canvas.getContext("webgl") ||
        canvas.getContext("experimental-webgl")
    );
  } catch {
    return false;
  }
}

/**
 * The spinning satellite globe behind the hero copy. Split out of HeroGlobe
 * so the copy paints immediately and Mapbox loads after (next/dynamic, ssr:false).
 */
export default function HeroGlobeCanvas({ projects }: HeroGlobeCanvasProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) return;
    // No WebGL: skip the map and leave the dark hero background in place.
    if (!hasWebGL()) return;
    mapboxgl.accessToken = token;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

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

    // Swallow Mapbox runtime errors (tile/style failures) so they do not surface as uncaught console errors.
    mapInstance.on("error", () => {});

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

      // Spin (skipped when the visitor prefers reduced motion)
      if (reduceMotion) return;
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
    <div
      ref={mapContainer}
      aria-hidden="true"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: "none",
      }}
    />
  );
}
