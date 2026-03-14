"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  Project,
  PROJECT_TYPES,
  ProjectType,
  getTypeColor,
  TYPE_COLORS,
} from "@/lib/types";
import Image from "next/image";
import { Building2, Globe, Calendar, Map, Moon, Search, X, Earth, Sun } from "lucide-react";

type ViewMode = "space" | "globe" | "flat" | "dark";

const VIEW_STYLES: Record<ViewMode, string> = {
  space: "mapbox://styles/mapbox/satellite-streets-v12",
  globe: "mapbox://styles/mapbox/light-v11",
  flat: "mapbox://styles/mapbox/light-v11",
  dark: "mapbox://styles/mapbox/dark-v11",
};

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
  const [viewMode, setViewMode] = useState<ViewMode>("space");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [mapInteractive, setMapInteractive] = useState(true);
  const [legendOpen, setLegendOpen] = useState(
    typeof window !== "undefined" ? window.innerWidth >= 768 : true
  );
  const prevStyleRef = useRef<string>("mapbox://styles/mapbox/light-v11");

  const mappableProjects = projects.filter((p) => p.lat && p.lng);

  const filteredProjects = mappableProjects.filter((p) => {
    const matchesType = activeFilter === "All" || p.type === activeFilter;
    const matchesSearch =
      !searchQuery ||
      p.partner.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.city && p.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.country && p.country.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const totalProjects = mappableProjects.length;
  const countries = new Set(projects.map((p) => p.country).filter(Boolean)).size;
  const years = projects.filter((p) => p.startYear).map((p) => p.startYear!);
  const yearRange = years.length
    ? `${Math.min(...years)}\u2013${Math.max(...years)}`
    : "";

  const isDark = viewMode === "dark";
  const isDarkMap = viewMode === "dark" || viewMode === "space";
  const isGlobeView = viewMode !== "flat";
  const spinsAutomatically = viewMode === "space" || viewMode === "globe" || viewMode === "dark";

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
      if (!popupRef.current && spinsAutomatically) startSpin();
    }, delay);
  }

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

  function setupLayers(mapInstance: mapboxgl.Map) {
    // Remove old layers/source if they exist
    ["cluster-count", "clusters", "project-pins", "project-pins-hover"].forEach((id) => {
      if (mapInstance.getLayer(id)) mapInstance.removeLayer(id);
    });
    if (mapInstance.getSource("projects")) mapInstance.removeSource("projects");

    mapInstance.addSource("projects", {
      type: "geojson",
      data: buildGeoJSON(filteredProjects),
      cluster: true,
      clusterMaxZoom: 7,
      clusterRadius: 25,
    });

    // Cluster dots — subtle, same style as pins just slightly bigger
    mapInstance.addLayer({
      id: "clusters",
      type: "circle",
      source: "projects",
      filter: ["has", "point_count"],
      paint: {
        "circle-color": isDarkMap ? "#cb463a" : "#cb463a",
        "circle-radius": [
          "step", ["get", "point_count"],
          12, 3, 15, 8, 18, 15, 22,
        ],
        "circle-stroke-width": 2,
        "circle-stroke-color": isDarkMap ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.8)",
        "circle-opacity": 0.85,
      },
    });

    // Cluster count label
    mapInstance.addLayer({
      id: "cluster-count",
      type: "symbol",
      source: "projects",
      filter: ["has", "point_count"],
      layout: {
        "text-field": ["get", "point_count_abbreviated"],
        "text-size": 11,
      },
      paint: {
        "text-color": "#ffffff",
      },
    });

    // Individual pins — scale with zoom
    mapInstance.addLayer({
      id: "project-pins",
      type: "circle",
      source: "projects",
      filter: ["!", ["has", "point_count"]],
      paint: {
        "circle-radius": [
          "interpolate", ["linear"], ["zoom"],
          2, 5,
          5, 7,
          8, 10,
          12, 14,
        ],
        "circle-color": ["get", "color"],
        "circle-stroke-width": 2,
        "circle-stroke-color": isDarkMap ? "rgba(255,255,255,0.5)" : "#ffffff",
        "circle-opacity": 0.9,
      },
    });

    // Hover layer
    mapInstance.addLayer({
      id: "project-pins-hover",
      type: "circle",
      source: "projects",
      filter: ["==", "idx", -1],
      paint: {
        "circle-radius": [
          "interpolate", ["linear"], ["zoom"],
          2, 8,
          5, 11,
          8, 14,
          12, 18,
        ],
        "circle-color": ["get", "color"],
        "circle-stroke-width": 2.5,
        "circle-stroke-color": isDarkMap ? "rgba(255,255,255,0.7)" : "#ffffff",
        "circle-opacity": 0.95,
      },
    });
  }

  function setupInteractions(mapInstance: mapboxgl.Map) {
    // Hover
    mapInstance.on("mouseenter", "project-pins", (e) => {
      mapInstance.getCanvas().style.cursor = "pointer";
      if (e.features?.[0]) {
        mapInstance.setFilter("project-pins-hover", [
          "==", "idx", e.features[0].properties!.idx,
        ]);
      }
    });
    mapInstance.on("mouseleave", "project-pins", () => {
      mapInstance.getCanvas().style.cursor = "";
      mapInstance.setFilter("project-pins-hover", ["==", "idx", -1]);
    });

    // Cluster hover + click to zoom
    mapInstance.on("mouseenter", "clusters", () => {
      mapInstance.getCanvas().style.cursor = "pointer";
    });
    mapInstance.on("mouseleave", "clusters", () => {
      mapInstance.getCanvas().style.cursor = "";
    });
    mapInstance.on("click", "clusters", (e) => {
      const features = mapInstance.queryRenderedFeatures(e.point, { layers: ["clusters"] });
      if (!features.length) return;
      const clusterId = features[0].properties!.cluster_id;
      const source = mapInstance.getSource("projects") as mapboxgl.GeoJSONSource;
      const coords = (features[0].geometry as GeoJSON.Point).coordinates as [number, number];
      source.getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err || zoom == null) return;
        mapInstance.flyTo({ center: coords, zoom: zoom + 1, duration: 500 });
      });
    });

    // Click pin
    mapInstance.on("click", "project-pins", (e) => {
      if (!e.features?.length) return;
      stopSpin();
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
      if (popupRef.current) popupRef.current.remove();

      const feat = e.features[0];
      const coords = (feat.geometry as GeoJSON.Point).coordinates.slice() as [number, number];
      const point = e.point;
      const nearby = mapInstance.queryRenderedFeatures(
        [[point.x - 10, point.y - 10], [point.x + 10, point.y + 10]],
        { layers: ["project-pins"] }
      );

      const dark = isDarkMap;
      const html = nearby.length > 1
        ? buildMultiPopupHTML(nearby.map((f) => f.properties!), dark)
        : buildSinglePopupHTML(feat.properties!, dark);

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

    // Click empty → close popup
    mapInstance.on("click", (e) => {
      const pins = mapInstance.queryRenderedFeatures(e.point, { layers: ["project-pins", "clusters"] });
      if (!pins.length && popupRef.current) {
        popupRef.current.remove();
        popupRef.current = null;
        scheduleResume(3000);
      }
    });
  }

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
      style: VIEW_STYLES["space"],
      center: [20, 5],
      zoom: 2,
      minZoom: 1.5,
      maxZoom: 15,
      projection: "globe",
      scrollZoom: true,
      dragPan: true,
      dragRotate: true,
      touchZoomRotate: true,
      doubleClickZoom: true,
      attributionControl: false,
      logoPosition: "bottom-left",
    });

    mapInstance.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      "top-right"
    );

    mapInstance.on("load", () => {
      applyFog(mapInstance, viewMode);
      setupLayers(mapInstance);
      setupInteractions(mapInstance);
      setMapReady(true);
      startSpin();
    });

    ["mousedown", "touchstart", "wheel", "dblclick"].forEach((evt) => {
      mapInstance.on(evt as any, () => {
        stopSpin();
        // Only auto-resume spin if map is not in interactive mode
        if (!mapInteractive) scheduleResume();
      });
    });

    prevStyleRef.current = VIEW_STYLES["space"];
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

  // Handle view mode changes
  useEffect(() => {
    if (!map.current || !mapReady) return;
    const m = map.current;
    const newStyle = VIEW_STYLES[viewMode];

    if (newStyle !== prevStyleRef.current) {
      // Style change needed (switching to/from dark)
      if (popupRef.current) popupRef.current.remove();
      m.setStyle(newStyle);
      m.once("style.load", () => {
        m.setProjection(isGlobeView ? "globe" : "mercator");
        applyFog(m, viewMode);
        setupLayers(m);
        setupInteractions(m);
        if (spinsAutomatically) startSpin(); else stopSpin();
      });
      prevStyleRef.current = newStyle;
    } else {
      m.setProjection(isGlobeView ? "globe" : "mercator");
      applyFog(m, viewMode);
      if (spinsAutomatically) startSpin(); else stopSpin();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, mapReady]);

  // Update data on filter/search change
  useEffect(() => {
    if (!map.current || !mapReady) return;
    const source = map.current.getSource("projects") as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData(buildGeoJSON(filteredProjects));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter, searchQuery, mapReady]);

  const filterCounts = PROJECT_TYPES.map((type) => ({
    type,
    count:
      type === "All"
        ? mappableProjects.length
        : mappableProjects.filter((p) => p.type === type).length,
  })).filter((f) => f.count > 0);

  const headerBg = isDark ? "#1a1a2e" : "white";
  const headerBorder = isDark ? "#333" : "#d6d6d6";
  const headerText = isDark ? "#e0e0e0" : "#374859";
  const headerMuted = isDark ? "#888" : "#999";
  const filterBg = isDark ? "#12121f" : "#faf9f5";
  const filterActiveBg = isDark ? "#cb463a" : "#374859";
  const filterInactiveBg = isDark ? "#1a1a2e" : "white";
  const filterInactiveText = isDark ? "#aaa" : "#374859";
  const filterInactiveBorder = isDark ? "#444" : "#d6d6d6";

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
          borderBottom: `1px solid ${headerBorder}`,
          background: headerBg,
          padding: "12px 24px",
          transition: "background 0.3s, border-color 0.3s",
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
            src="/cfc-logo.png"
            alt="Construction for Change"
            width={140}
            height={140}
            style={{ objectFit: "contain", maxHeight: "60px", width: "auto" }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <StatBadge icon={<Building2 size={16} color="#cb463a" />} value={totalProjects} label="Projects" textColor={headerText} mutedColor={headerMuted} />
            <StatBadge icon={<Globe size={16} color="#cb463a" />} value={countries} label="Countries" textColor={headerText} mutedColor={headerMuted} />
            {/* Search toggle */}
            <button
              onClick={() => { setSearchOpen(!searchOpen); if (searchOpen) setSearchQuery(""); }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 36,
                height: 36,
                borderRadius: "50%",
                border: `1px solid ${headerBorder}`,
                background: searchOpen ? (isDark ? "#cb463a" : "#374859") : "transparent",
                color: searchOpen ? "white" : headerMuted,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {searchOpen ? <X size={16} /> : <Search size={16} />}
            </button>
          </div>
        </div>
        {/* Search bar */}
        {searchOpen && (
          <div style={{ marginTop: "10px" }}>
            <input
              autoFocus
              type="text"
              placeholder="Search by partner, city, or country..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                maxWidth: "500px",
                padding: "8px 14px",
                borderRadius: "8px",
                border: `1px solid ${headerBorder}`,
                background: isDark ? "#2a2a3e" : "#faf9f5",
                color: headerText,
                fontSize: "14px",
                outline: "none",
              }}
            />
            {searchQuery && (
              <span style={{ marginLeft: "12px", fontSize: "12px", color: headerMuted }}>
                {filteredProjects.length} result{filteredProjects.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Filters */}
      <div
        style={{
          borderBottom: `1px solid ${headerBorder}`,
          background: filterBg,
          padding: "10px 24px",
          display: "flex",
          gap: "8px",
          overflowX: "auto",
          transition: "background 0.3s, border-color 0.3s",
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
              border: activeFilter === type ? "none" : `1px solid ${filterInactiveBorder}`,
              background: activeFilter === type ? filterActiveBg : filterInactiveBg,
              color: activeFilter === type ? "white" : filterInactiveText,
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
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        />

        {/* Color legend — collapsible, top-right */}
        <div
          style={{
            position: "absolute",
            top: 12,
            right: 50,
            zIndex: 5,
          }}
        >
          {legendOpen ? (
            <div
              style={{
                background: isDarkMap ? "rgba(20,20,35,0.92)" : "rgba(255,255,255,0.94)",
                borderRadius: "10px",
                padding: "12px 16px",
                boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
                border: `1px solid ${isDarkMap ? "#444" : "#d6d6d6"}`,
                backdropFilter: "blur(8px)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                  cursor: "pointer",
                }}
                onClick={() => setLegendOpen(false)}
              >
                <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", color: isDarkMap ? "#aaa" : "#999" }}>
                  Project Types
                </span>
                <X size={12} style={{ color: isDarkMap ? "#aaa" : "#999" }} />
              </div>
              {Object.entries(TYPE_COLORS).map(([type, color]) => (
                <div key={type} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: color, display: "inline-block", flexShrink: 0, border: isDarkMap ? "1px solid rgba(255,255,255,0.2)" : "none" }} />
                  <span style={{ fontSize: "11px", color: isDarkMap ? "#ccc" : "#374859" }}>{type}</span>
                </div>
              ))}
            </div>
          ) : (
            <button
              onClick={() => setLegendOpen(true)}
              style={{
                background: isDarkMap ? "rgba(20,20,35,0.9)" : "rgba(255,255,255,0.92)",
                borderRadius: "9999px",
                padding: "8px 14px",
                boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
                border: `1px solid ${isDarkMap ? "#444" : "#d6d6d6"}`,
                backdropFilter: "blur(8px)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "11px",
                fontWeight: 600,
                color: isDarkMap ? "#ccc" : "#374859",
              }}
            >
              <div style={{ display: "flex", gap: "3px" }}>
                {Object.values(TYPE_COLORS).slice(0, 4).map((c, i) => (
                  <span key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: c, display: "inline-block" }} />
                ))}
              </div>
              Legend
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function applyFog(m: mapboxgl.Map, mode: ViewMode) {
  if (mode === "space") {
    m.setFog({
      color: "rgb(220, 230, 240)",
      "high-color": "rgb(70, 130, 220)",
      "horizon-blend": 0.03,
      "space-color": "rgb(5, 5, 20)",
      "star-intensity": 0.8,
    });
  } else if (mode === "globe") {
    m.setFog({
      color: "rgb(255, 255, 255)",
      "high-color": "rgb(200, 210, 220)",
      "horizon-blend": 0.04,
      "space-color": "rgb(235, 238, 242)",
      "star-intensity": 0,
    });
  } else if (mode === "dark") {
    m.setFog({
      color: "rgb(30, 30, 50)",
      "high-color": "rgb(20, 20, 80)",
      "horizon-blend": 0.03,
      "space-color": "rgb(5, 5, 15)",
      "star-intensity": 0.8,
    });
  } else {
    m.setFog({} as any);
  }
}

function StatBadge({
  icon,
  value,
  label,
  textColor,
  mutedColor,
}: {
  icon: React.ReactNode;
  value: string | number;
  label?: string;
  textColor?: string;
  mutedColor?: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      {icon}
      <span style={{ fontWeight: 700, fontSize: "14px", color: textColor || "#374859" }}>
        {value}
      </span>
      {label && (
        <span style={{ fontSize: "11px", color: mutedColor || "#999" }}>{label}</span>
      )}
    </div>
  );
}

function buildSinglePopupHTML(props: Record<string, any>, dark: boolean): string {
  const color = props.color || "#999";
  const bg = dark ? "#1a1a2e" : "white";
  const text = dark ? "#e0e0e0" : "#374859";
  const muted = dark ? "#888" : "#999";
  const border = dark ? "#444" : "#d6d6d6";
  const yr =
    props.startYear && props.startYear > 0
      ? props.endYear && props.endYear > 0
        ? `${props.startYear}\u2013${props.endYear}`
        : `${props.startYear}\u2013Present`
      : "";
  return `
    <div style="width:270px;border-radius:8px;background:${bg};box-shadow:0 4px 20px rgba(0,0,0,${dark ? "0.4" : "0.15"});overflow:hidden;border:1px solid ${border}">
      <div style="height:5px;background:${color}"></div>
      <div style="padding:14px">
        <div style="font-weight:700;font-size:14px;color:${text};line-height:1.3">${props.partner}</div>
        ${props.details ? `<div style="font-size:12px;color:${muted};margin-top:4px">${props.details}</div>` : ""}
        <div style="display:flex;align-items:center;gap:12px;margin-top:8px;font-size:11px;color:${muted}">
          ${props.city ? `<span>${props.city}${props.country ? `, ${props.country}` : ""}</span>` : ""}
          ${yr ? `<span>${yr}</span>` : ""}
        </div>
        <div style="margin-top:8px">
          <span style="display:inline-block;font-size:10px;padding:2px 10px;border-radius:9999px;color:white;background:${color}">${props.type}</span>
          ${props.status === "active" ? `<span style="display:inline-block;font-size:10px;padding:2px 10px;border-radius:9999px;color:${text};background:${dark ? "#2a2a3e" : "#faf9f5"};margin-left:4px;border:1px solid ${border}">Active</span>` : ""}
        </div>
      </div>
    </div>
  `;
}

function buildMultiPopupHTML(propsList: Record<string, any>[], dark: boolean): string {
  const first = propsList[0];
  const bg = dark ? "#1a1a2e" : "white";
  const headerBg = dark ? "#cb463a" : "#374859";
  const text = dark ? "#e0e0e0" : "#374859";
  const muted = dark ? "#888" : "#999";
  const border = dark ? "#444" : "#d6d6d6";
  const divider = dark ? "#333" : "#eee";

  const items = propsList
    .map((p) => {
      return `
      <div style="padding:10px 14px;border-bottom:1px solid ${divider}">
        <div style="font-weight:700;font-size:13px;color:${text}">${p.partner}</div>
        ${p.details ? `<div style="font-size:11px;color:${muted};margin-top:2px">${p.details}</div>` : ""}
        <span style="display:inline-block;font-size:10px;padding:1px 8px;border-radius:9999px;color:white;background:${p.color || "#999"};margin-top:4px">${p.type}</span>
      </div>`;
    })
    .join("");

  return `
    <div style="width:270px;max-height:350px;overflow-y:auto;border-radius:8px;background:${bg};box-shadow:0 4px 20px rgba(0,0,0,${dark ? "0.4" : "0.15"});border:1px solid ${border}">
      <div style="padding:10px 14px;background:${headerBg};color:white;font-weight:700;font-size:13px;position:sticky;top:0;z-index:1">
        ${propsList.length} Projects \u2014 ${first.city || first.country || ""}
      </div>
      ${items}
    </div>
  `;
}
