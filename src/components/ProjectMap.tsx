"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  Project,
  PROJECT_TYPES,
  ProjectType,
  getTypeColor,
} from "@/lib/types";
import Image from "next/image";
import { Building2, Globe, Calendar, Map } from "lucide-react";

interface ProjectMapProps {
  projects: Project[];
}

export function ProjectMap({ projects }: ProjectMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const spinningRef = useRef(true);
  const spinFrameRef = useRef<number | null>(null);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeFilter, setActiveFilter] = useState<ProjectType>("All");
  const [mapReady, setMapReady] = useState(false);
  const [isGlobe, setIsGlobe] = useState(true);

  const mappableProjects = projects.filter((p) => p.lat && p.lng);
  const filteredProjects =
    activeFilter === "All"
      ? mappableProjects
      : mappableProjects.filter((p) => p.type === activeFilter);

  const totalProjects = projects.length;
  const countries = new Set(projects.map((p) => p.country).filter(Boolean)).size;
  const years = projects.filter((p) => p.startYear).map((p) => p.startYear!);
  const yearRange = years.length
    ? `${Math.min(...years)}\u2013${Math.max(...years)}`
    : "";

  function startSpin() {
    if (spinningRef.current && spinFrameRef.current) return;
    spinningRef.current = true;
    const spin = () => {
      if (!spinningRef.current || !map.current) return;
      const center = map.current.getCenter();
      center.lng += 0.01;
      map.current.jumpTo({ center });
      spinFrameRef.current = requestAnimationFrame(spin);
    };
    spin();
  }

  function stopSpin() {
    spinningRef.current = false;
    if (spinFrameRef.current) {
      cancelAnimationFrame(spinFrameRef.current);
      spinFrameRef.current = null;
    }
  }

  function scheduleResume(delay = 5000) {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      if (!popupRef.current) startSpin();
    }, delay);
  }

  // Build GeoJSON from projects
  const buildGeoJSON = useCallback(
    (projectList: Project[]): GeoJSON.FeatureCollection => ({
      type: "FeatureCollection",
      features: projectList
        .filter((p) => p.lat && p.lng)
        .map((p, i) => ({
          type: "Feature" as const,
          geometry: {
            type: "Point" as const,
            coordinates: [p.lng!, p.lat!],
          },
          properties: {
            idx: i,
            partner: p.partner,
            city: p.city || "",
            country: p.country || "",
            type: p.type || "Other",
            details: p.details || "",
            startYear: p.startYear || 0,
            endYear: p.endYear || 0,
            status: p.status,
            color: getTypeColor(p.type),
          },
        })),
    }),
    []
  );

  // Init map
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      console.error("Missing NEXT_PUBLIC_MAPBOX_TOKEN");
      return;
    }
    mapboxgl.accessToken = token;

    const mapInstance = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [20, 5],
      zoom: 2,
      minZoom: 1.5,
      maxZoom: 15,
      projection: "globe",
    });

    mapInstance.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      "top-right"
    );

    mapInstance.on("load", () => {
      // Globe atmosphere
      mapInstance.setFog({
        color: "rgb(255, 255, 255)",
        "high-color": "rgb(200, 210, 220)",
        "horizon-blend": 0.05,
        "space-color": "rgb(220, 225, 230)",
        "star-intensity": 0,
      });

      // Add source
      mapInstance.addSource("projects", {
        type: "geojson",
        data: buildGeoJSON(filteredProjects),
      });

      // Circle layer for pins
      mapInstance.addLayer({
        id: "project-pins",
        type: "circle",
        source: "projects",
        paint: {
          "circle-radius": 7,
          "circle-color": ["get", "color"],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
          "circle-opacity": 0.9,
        },
      });

      // Hover effect — bigger radius
      mapInstance.addLayer({
        id: "project-pins-hover",
        type: "circle",
        source: "projects",
        paint: {
          "circle-radius": 10,
          "circle-color": ["get", "color"],
          "circle-stroke-width": 2.5,
          "circle-stroke-color": "#ffffff",
          "circle-opacity": 0.9,
        },
        filter: ["==", "idx", -1], // nothing selected initially
      });

      // Cursor
      mapInstance.on("mouseenter", "project-pins", (e) => {
        mapInstance.getCanvas().style.cursor = "pointer";
        if (e.features?.[0]) {
          mapInstance.setFilter("project-pins-hover", [
            "==",
            "idx",
            e.features[0].properties!.idx,
          ]);
        }
      });
      mapInstance.on("mouseleave", "project-pins", () => {
        mapInstance.getCanvas().style.cursor = "";
        mapInstance.setFilter("project-pins-hover", ["==", "idx", -1]);
      });

      // Click handler
      mapInstance.on("click", "project-pins", (e) => {
        if (!e.features?.length) return;

        stopSpin();
        if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);

        if (popupRef.current) popupRef.current.remove();

        const feat = e.features[0];
        const coords = (feat.geometry as GeoJSON.Point).coordinates.slice() as [number, number];
        const props = feat.properties!;

        // Gather all projects at this click point (within a small radius)
        const point = e.point;
        const nearby = mapInstance.queryRenderedFeatures(
          [
            [point.x - 10, point.y - 10],
            [point.x + 10, point.y + 10],
          ],
          { layers: ["project-pins"] }
        );

        const html =
          nearby.length > 1
            ? buildMultiPopupHTML(nearby.map((f) => f.properties!))
            : buildSinglePopupHTML(props);

        const popup = new mapboxgl.Popup({
          closeOnClick: false,
          closeButton: true,
          maxWidth: "300px",
          offset: 12,
        })
          .setLngLat(coords)
          .setHTML(html)
          .addTo(mapInstance);

        popup.on("close", () => {
          popupRef.current = null;
          scheduleResume(3000);
        });

        popupRef.current = popup;

        mapInstance.flyTo({
          center: coords,
          zoom: Math.max(mapInstance.getZoom(), 5),
          duration: 800,
        });
      });

      // Click on empty space closes popup
      mapInstance.on("click", (e) => {
        const features = mapInstance.queryRenderedFeatures(e.point, {
          layers: ["project-pins"],
        });
        if (!features.length && popupRef.current) {
          popupRef.current.remove();
          popupRef.current = null;
          scheduleResume(3000);
        }
      });

      setMapReady(true);
      startSpin();
    });

    // Pause spin on user interaction
    ["mousedown", "touchstart", "wheel", "dblclick"].forEach((evt) => {
      mapInstance.on(evt as any, () => {
        stopSpin();
        scheduleResume();
      });
    });

    map.current = mapInstance;

    return () => {
      stopSpin();
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
      if (popupRef.current) popupRef.current.remove();
      mapInstance.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update source data when filter changes
  useEffect(() => {
    if (!map.current || !mapReady) return;
    const source = map.current.getSource("projects") as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData(buildGeoJSON(filteredProjects));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter, mapReady]);

  // Toggle projection
  useEffect(() => {
    if (!map.current || !mapReady) return;
    map.current.setProjection(isGlobe ? "globe" : "mercator");
    if (isGlobe) {
      map.current.setFog({
        color: "rgb(255, 255, 255)",
        "high-color": "rgb(200, 210, 220)",
        "horizon-blend": 0.05,
        "space-color": "rgb(220, 225, 230)",
        "star-intensity": 0,
      });
    } else {
      map.current.setFog({} as any);
    }
  }, [isGlobe, mapReady]);

  const filterCounts = PROJECT_TYPES.map((type) => ({
    type,
    count:
      type === "All"
        ? mappableProjects.length
        : mappableProjects.filter((p) => p.type === type).length,
  })).filter((f) => f.count > 0);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100%",
      }}
    >
      {/* Header */}
      <div
        style={{
          borderBottom: "1px solid #d6d6d6",
          background: "white",
          padding: "12px 24px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <Image
            src="/cfc-logo.webp"
            alt="Construction for Change"
            width={44}
            height={44}
            style={{ objectFit: "contain" }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <StatBadge
              icon={<Building2 size={16} color="#cb463a" />}
              value={totalProjects}
              label="Projects"
            />
            <StatBadge
              icon={<Globe size={16} color="#cb463a" />}
              value={countries}
              label="Countries"
            />
            <StatBadge
              icon={<Calendar size={16} color="#cb463a" />}
              value={yearRange}
            />
            {/* Globe / Flat toggle */}
            <button
              onClick={() => setIsGlobe(!isGlobe)}
              title={isGlobe ? "Switch to flat map" : "Switch to globe"}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "5px 12px",
                borderRadius: "9999px",
                fontSize: "12px",
                fontWeight: 600,
                border: "1px solid #d6d6d6",
                background: "white",
                color: "#374859",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {isGlobe ? <Map size={14} /> : <Globe size={14} />}
              {isGlobe ? "Flat" : "Globe"}
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div
        style={{
          borderBottom: "1px solid #d6d6d6",
          background: "#faf9f5",
          padding: "10px 24px",
          display: "flex",
          gap: "8px",
          overflowX: "auto",
        }}
      >
        {filterCounts.map(({ type, count }) => (
          <button
            key={type}
            onClick={() => setActiveFilter(type)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 14px",
              borderRadius: "9999px",
              fontSize: "12px",
              fontWeight: 600,
              whiteSpace: "nowrap",
              border:
                activeFilter === type ? "none" : "1px solid #d6d6d6",
              background: activeFilter === type ? "#374859" : "white",
              color: activeFilter === type ? "white" : "#374859",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {type !== "All" && (
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: getTypeColor(type),
                  display: "inline-block",
                }}
              />
            )}
            {type}
            <span style={{ fontSize: "10px", opacity: 0.6 }}>{count}</span>
          </button>
        ))}
      </div>

      {/* Map */}
      <div style={{ flex: 1, position: "relative" }}>
        <div
          ref={mapContainer}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        />
      </div>
    </div>
  );
}

function StatBadge({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string | number;
  label?: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      {icon}
      <span style={{ fontWeight: 700, fontSize: "14px", color: "#374859" }}>
        {value}
      </span>
      {label && (
        <span style={{ fontSize: "11px", color: "#999" }}>{label}</span>
      )}
    </div>
  );
}

function buildSinglePopupHTML(props: Record<string, any>): string {
  const color = props.color || "#999";
  const yr =
    props.startYear && props.startYear > 0
      ? props.endYear && props.endYear > 0
        ? `${props.startYear}\u2013${props.endYear}`
        : `${props.startYear}\u2013Present`
      : "";
  return `
    <div style="width:270px;border-radius:8px;background:white;box-shadow:0 4px 20px rgba(0,0,0,0.15);overflow:hidden;border:1px solid #d6d6d6">
      <div style="height:5px;background:${color}"></div>
      <div style="padding:14px">
        <div style="font-weight:700;font-size:14px;color:#374859;line-height:1.3">${props.partner}</div>
        ${props.details ? `<div style="font-size:12px;color:#999;margin-top:4px">${props.details}</div>` : ""}
        <div style="display:flex;align-items:center;gap:12px;margin-top:8px;font-size:11px;color:#999">
          ${props.city ? `<span>${props.city}${props.country ? `, ${props.country}` : ""}</span>` : ""}
          ${yr ? `<span>${yr}</span>` : ""}
        </div>
        <div style="margin-top:8px">
          <span style="display:inline-block;font-size:10px;padding:2px 10px;border-radius:9999px;color:white;background:${color}">${props.type}</span>
          ${props.status === "active" ? '<span style="display:inline-block;font-size:10px;padding:2px 10px;border-radius:9999px;color:#374859;background:#faf9f5;margin-left:4px;border:1px solid #d6d6d6">Active</span>' : ""}
        </div>
      </div>
    </div>
  `;
}

function buildMultiPopupHTML(propsList: Record<string, any>[]): string {
  const first = propsList[0];
  const items = propsList
    .map((p) => {
      return `
      <div style="padding:10px 14px;border-bottom:1px solid #eee">
        <div style="font-weight:700;font-size:13px;color:#374859">${p.partner}</div>
        ${p.details ? `<div style="font-size:11px;color:#999;margin-top:2px">${p.details}</div>` : ""}
        <span style="display:inline-block;font-size:10px;padding:1px 8px;border-radius:9999px;color:white;background:${p.color || "#999"};margin-top:4px">${p.type}</span>
      </div>`;
    })
    .join("");

  return `
    <div style="width:270px;max-height:350px;overflow-y:auto;border-radius:8px;background:white;box-shadow:0 4px 20px rgba(0,0,0,0.15);border:1px solid #d6d6d6">
      <div style="padding:10px 14px;background:#374859;color:white;font-weight:700;font-size:13px;position:sticky;top:0;z-index:1">
        ${propsList.length} Projects \u2014 ${first.city || first.country || ""}
      </div>
      ${items}
    </div>
  `;
}
