"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Project } from "@/lib/types";

// ISO 3166-1 alpha-3 codes for countries CfC has worked in
const CFC_COUNTRY_CODES = [
  "BOL", // Bolivia
  "KHM", // Cambodia
  "DMA", // Dominica
  "DOM", // Dominican Republic
  "GIN", // Guinea
  "GNB", // Guinea-Bissau
  "HTI", // Haiti
  "IND", // India
  "KEN", // Kenya
  "LBR", // Liberia
  "MWI", // Malawi
  "NPL", // Nepal
  "PRI", // Puerto Rico
  "RWA", // Rwanda
  "SLB", // Solomon Islands
  "ZAF", // South Africa
  "TGO", // Togo
  "VGB", // Tortola / BVI
  "USA", // USA
  "VIR", // USVI
  "UGA", // Uganda
  "ZMB", // Zambia
  "HND", // Honduras (active precon)
  "SSD", // South Sudan (active precon)
];

const PIN_COLORS = {
  active: "#cb463a",
  completed: "#374859",
};

const COUNTRY_HIGHLIGHT = "#d4e8d0";

interface ProjectMapProps {
  projects: Project[];
}

export function ProjectMap({ projects }: ProjectMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const pinnedRef = useRef(false);
  const [mapReady, setMapReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "completed">("all");
  const [legendOpen, setLegendOpen] = useState(false);

  const mappableProjects = projects.filter((p) => p.lat && p.lng);

  const filteredProjects = mappableProjects.filter((p) => {
    const matchesStatus =
      statusFilter === "all" || p.status === statusFilter;
    const matchesSearch =
      !searchQuery ||
      p.partner.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.city && p.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.country && p.country.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const totalProjects = mappableProjects.length;
  const activeCount = mappableProjects.filter((p) => p.status === "active").length;
  const completedCount = mappableProjects.filter((p) => p.status === "completed").length;
  const countries = new Set(projects.map((p) => p.country).filter(Boolean)).size;
  const years = projects.filter((p) => p.startYear).map((p) => p.startYear!);
  const yearRange = years.length
    ? `${Math.min(...years)}\u2013Present`
    : "";

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
            status: p.status || "completed",
            imageUrl: p.imageUrl || "",
            color: p.status === "active" ? PIN_COLORS.active : PIN_COLORS.completed,
          },
        })),
    }),
    []
  );

  function createPinImage(
    color: string,
    size: number = 28
  ): { width: number; height: number; data: Uint8Array } {
    const w = size;
    const h = Math.round(size * 1.4);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;

    const cx = w / 2;
    const r = w * 0.38;
    const cy = r + 2; // center of the circle part
    const tipY = h - 1;

    // Draw pin: circle head + pointed bottom
    ctx.beginPath();
    // Start from bottom tip, curve up the left side, arc across the top, curve down the right side
    ctx.moveTo(cx, tipY);
    ctx.bezierCurveTo(cx - r * 0.3, cy + r * 1.2, cx - r, cy + r * 0.4, cx - r, cy);
    ctx.arc(cx, cy, r, Math.PI, 0, false);
    ctx.bezierCurveTo(cx + r, cy + r * 0.4, cx + r * 0.3, cy + r * 1.2, cx, tipY);
    ctx.closePath();

    // Shadow
    ctx.shadowColor = "rgba(0,0,0,0.25)";
    ctx.shadowBlur = 3;
    ctx.shadowOffsetY = 1;
    ctx.fillStyle = color;
    ctx.fill();

    // Reset shadow for stroke
    ctx.shadowColor = "transparent";
    ctx.strokeStyle = "white";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Inner dot
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.38, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.fill();

    const imageData = ctx.getImageData(0, 0, w, h);
    return { width: w, height: h, data: new Uint8Array(imageData.data.buffer) };
  }

  function setupCountryHighlights(mapInstance: mapboxgl.Map) {
    if (mapInstance.getSource("country-boundaries")) return;

    mapInstance.addSource("country-boundaries", {
      type: "vector",
      url: "mapbox://mapbox.country-boundaries-v1",
    });

    // Find the first symbol layer to insert below labels
    const layers = mapInstance.getStyle().layers || [];
    let insertBefore: string | undefined;
    for (const layer of layers) {
      if (layer.type === "symbol") {
        insertBefore = layer.id;
        break;
      }
    }

    mapInstance.addLayer(
      {
        id: "cfc-country-fills",
        type: "fill",
        source: "country-boundaries",
        "source-layer": "country_boundaries",
        paint: {
          "fill-color": [
            "case",
            ["in", ["get", "iso_3166_1_alpha_3"], ["literal", CFC_COUNTRY_CODES]],
            COUNTRY_HIGHLIGHT,
            "rgba(0,0,0,0)",
          ],
          "fill-opacity": 0.6,
        },
      },
      insertBefore
    );

    mapInstance.addLayer(
      {
        id: "cfc-country-borders",
        type: "line",
        source: "country-boundaries",
        "source-layer": "country_boundaries",
        paint: {
          "line-color": [
            "case",
            ["in", ["get", "iso_3166_1_alpha_3"], ["literal", CFC_COUNTRY_CODES]],
            "#9abb94",
            "rgba(0,0,0,0)",
          ],
          "line-width": 1,
          "line-opacity": 0.5,
        },
      },
      insertBefore
    );
  }

  function setupLayers(mapInstance: mapboxgl.Map) {
    ["cluster-count", "clusters", "project-pins"].forEach((id) => {
      if (mapInstance.getLayer(id)) mapInstance.removeLayer(id);
    });
    if (mapInstance.getSource("projects")) mapInstance.removeSource("projects");

    mapInstance.addSource("projects", {
      type: "geojson",
      data: buildGeoJSON(filteredProjects),
      cluster: true,
      clusterMaxZoom: 8,
      clusterRadius: 30,
    });

    // Cluster circles
    mapInstance.addLayer({
      id: "clusters",
      type: "circle",
      source: "projects",
      filter: ["has", "point_count"],
      paint: {
        "circle-color": "#374859",
        "circle-radius": [
          "step",
          ["get", "point_count"],
          14, 5, 18, 10, 22, 20, 26,
        ],
        "circle-stroke-width": 2,
        "circle-stroke-color": "white",
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
        "text-size": 12,
        "text-font": ["DIN Pro Medium", "Arial Unicode MS Bold"],
      },
      paint: {
        "text-color": "#ffffff",
      },
    });

    // Individual pins using symbol layer with custom icons
    mapInstance.addLayer({
      id: "project-pins",
      type: "symbol",
      source: "projects",
      filter: ["!", ["has", "point_count"]],
      layout: {
        "icon-image": [
          "case",
          ["==", ["get", "status"], "active"],
          "pin-active",
          "pin-completed",
        ],
        "icon-size": [
          "interpolate",
          ["linear"],
          ["zoom"],
          2, 0.6,
          5, 0.8,
          8, 1,
          12, 1.2,
        ],
        "icon-anchor": "bottom",
        "icon-allow-overlap": true,
        "icon-ignore-placement": true,
      },
    });
  }

  function setupInteractions(mapInstance: mapboxgl.Map) {
    // Hover on pins — show lightweight popup (only if nothing pinned)
    mapInstance.on("mouseenter", "project-pins", (e) => {
      mapInstance.getCanvas().style.cursor = "pointer";
      if (pinnedRef.current) return; // don't override pinned popup
      if (!e.features?.length) return;

      const feat = e.features[0];
      const coords = (feat.geometry as GeoJSON.Point).coordinates.slice() as [number, number];

      const point = e.point;
      const nearby = mapInstance.queryRenderedFeatures(
        [[point.x - 8, point.y - 8], [point.x + 8, point.y + 8]],
        { layers: ["project-pins"] }
      );

      if (popupRef.current) popupRef.current.remove();

      const isList = nearby.length > 1;
      const nearbyProps = nearby.map((f) => f.properties!);

      const popup = new mapboxgl.Popup({
        closeOnClick: false,
        closeButton: false,
        maxWidth: "360px",
        offset: 20,
      })
        .setLngLat(coords)
        .setHTML(isList ? buildMultiPopupListHTML(nearbyProps) : buildPinnedPopupHTML(feat.properties!))
        .addTo(mapInstance);

      if (isList) {
        attachMultiPopupListeners(popup.getElement()!, nearbyProps);
      }

      popupRef.current = popup;
    });

    mapInstance.on("mouseleave", "project-pins", () => {
      mapInstance.getCanvas().style.cursor = "";
      if (pinnedRef.current) return; // don't close pinned popup
      if (popupRef.current) {
        popupRef.current.remove();
        popupRef.current = null;
      }
    });

    // Click pin — pin the popup open with full detail card
    mapInstance.on("click", "project-pins", (e) => {
      if (!e.features?.length) return;
      const feat = e.features[0];
      const coords = (feat.geometry as GeoJSON.Point).coordinates.slice() as [number, number];

      const point = e.point;
      const nearby = mapInstance.queryRenderedFeatures(
        [[point.x - 8, point.y - 8], [point.x + 8, point.y + 8]],
        { layers: ["project-pins"] }
      );

      if (popupRef.current) popupRef.current.remove();

      const isList = nearby.length > 1;
      const nearbyProps = nearby.map((f) => f.properties!);

      const popup = new mapboxgl.Popup({
        closeOnClick: false,
        closeButton: false,
        maxWidth: "360px",
        offset: 20,
      })
        .setLngLat(coords)
        .setHTML(isList ? buildMultiPopupListHTML(nearbyProps) : buildPinnedPopupHTML(feat.properties!))
        .addTo(mapInstance);

      if (isList) {
        attachMultiPopupListeners(popup.getElement()!, nearbyProps);
      }

      popup.on("close", () => {
        pinnedRef.current = false;
        popupRef.current = null;
      });

      popupRef.current = popup;
      pinnedRef.current = true;

      mapInstance.flyTo({
        center: coords,
        zoom: Math.max(mapInstance.getZoom(), 6),
        duration: 600,
      });
    });

    // Cluster hover
    mapInstance.on("mouseenter", "clusters", () => {
      mapInstance.getCanvas().style.cursor = "pointer";
    });
    mapInstance.on("mouseleave", "clusters", () => {
      mapInstance.getCanvas().style.cursor = "";
    });

    // Click cluster — zoom in
    mapInstance.on("click", "clusters", (e) => {
      const features = mapInstance.queryRenderedFeatures(e.point, {
        layers: ["clusters"],
      });
      if (!features.length) return;
      const clusterId = features[0].properties!.cluster_id;
      const source = mapInstance.getSource("projects") as mapboxgl.GeoJSONSource;
      const coords = (features[0].geometry as GeoJSON.Point).coordinates as [number, number];
      source.getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err || zoom == null) return;
        mapInstance.flyTo({ center: coords, zoom: zoom + 1, duration: 500 });
      });
    });

    // Click empty — close popup
    mapInstance.on("click", (e) => {
      const pins = mapInstance.queryRenderedFeatures(e.point, {
        layers: ["project-pins", "clusters"],
      });
      if (!pins.length && popupRef.current) {
        popupRef.current.remove();
        popupRef.current = null;
        pinnedRef.current = false;
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
      style: "mapbox://styles/mapbox/light-v11",
      center: [20, 10],
      zoom: 2.2,
      minZoom: 1.5,
      maxZoom: 15,
      projection: "mercator",
      attributionControl: false,
    });

    mapInstance.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      "top-right"
    );

    mapInstance.on("load", () => {
      // Register pin icons
      const activePin = createPinImage(PIN_COLORS.active, 24);
      const completedPin = createPinImage(PIN_COLORS.completed, 24);

      mapInstance.addImage("pin-active", activePin);
      mapInstance.addImage("pin-completed", completedPin);

      setupCountryHighlights(mapInstance);
      setupLayers(mapInstance);
      setupInteractions(mapInstance);
      setMapReady(true);
    });

    map.current = mapInstance;

    return () => {
      if (popupRef.current) popupRef.current.remove();
      mapInstance.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update data on filter/search change
  useEffect(() => {
    if (!map.current || !mapReady) return;
    const source = map.current.getSource("projects") as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData(buildGeoJSON(filteredProjects));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, searchQuery, mapReady]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100dvh",
        width: "100%",
        overflow: "hidden",
      }}
    >
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

        {/* Top-left: Stats + Search */}
        <div
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            zIndex: 5,
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          {/* Stats bar */}
          <div
            style={{
              background: "rgba(255,255,255,0.95)",
              borderRadius: "10px",
              padding: "12px 16px",
              boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
              border: "1px solid #d6d6d6",
              display: "flex",
              gap: "20px",
              alignItems: "center",
              fontFamily: "var(--font-lato), Lato, sans-serif",
            }}
          >
            <div>
              <span style={{ fontWeight: 700, fontSize: "18px", color: "#374859" }}>
                {totalProjects}
              </span>
              <span style={{ fontSize: "11px", color: "#999", marginLeft: "4px" }}>
                Projects
              </span>
            </div>
            <div
              style={{ width: "1px", height: "20px", background: "#d6d6d6" }}
            />
            <div>
              <span style={{ fontWeight: 700, fontSize: "18px", color: "#374859" }}>
                {countries}
              </span>
              <span style={{ fontSize: "11px", color: "#999", marginLeft: "4px" }}>
                Countries
              </span>
            </div>
            <div
              style={{ width: "1px", height: "20px", background: "#d6d6d6" }}
            />
            <div>
              <span style={{ fontWeight: 600, fontSize: "13px", color: "#374859" }}>
                {yearRange}
              </span>
            </div>
          </div>

        </div>

        {/* Bottom-left: Legend (collapsible on mobile) */}
        <div
          style={{
            position: "absolute",
            bottom: 20,
            left: 12,
            zIndex: 5,
            background: "rgba(255,255,255,0.95)",
            borderRadius: "10px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
            border: "1px solid #d6d6d6",
            fontFamily: "var(--font-lato), Lato, sans-serif",
            overflow: "hidden",
          }}
        >
          {/* Legend toggle header */}
          <button
            onClick={() => setLegendOpen(!legendOpen)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              width: "100%",
              padding: "10px 14px",
              border: "none",
              background: "none",
              cursor: "pointer",
              fontSize: "10px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "1.5px",
              color: "#999",
            }}
          >
            <span>Legend</span>
            <svg
              width="10"
              height="10"
              viewBox="0 0 10 10"
              fill="none"
              stroke="#999"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                transform: legendOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s",
              }}
            >
              <path d="M2 4l3 3 3-3" />
            </svg>
          </button>

          {/* Legend content */}
          <div
            style={{
              maxHeight: legendOpen ? "200px" : "0px",
              overflow: "hidden",
              transition: "max-height 0.25s ease",
              padding: legendOpen ? "0 14px 10px" : "0 14px",
            }}
          >
            {/* Active pin */}
            <button
              onClick={() =>
                setStatusFilter(statusFilter === "active" ? "all" : "active")
              }
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "6px",
                cursor: "pointer",
                border: "none",
                background: "none",
                padding: "2px 0",
                opacity: statusFilter === "completed" ? 0.4 : 1,
                transition: "opacity 0.2s",
              }}
            >
              <span
                style={{
                  width: 12,
                  height: 16,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="12" height="16" viewBox="0 0 12 16">
                  <path
                    d="M6 0C2.7 0 0 2.7 0 6c0 4.5 6 10 6 10s6-5.5 6-10c0-3.3-2.7-6-6-6z"
                    fill={PIN_COLORS.active}
                  />
                  <circle cx="6" cy="6" r="2.5" fill="white" fillOpacity="0.9" />
                </svg>
              </span>
              <span style={{ fontSize: "12px", color: "#374859", fontWeight: 600 }}>
                Active Projects
              </span>
              <span
                style={{
                  fontSize: "11px",
                  color: "#999",
                  fontWeight: 400,
                }}
              >
                ({activeCount})
              </span>
            </button>

            {/* Completed pin */}
            <button
              onClick={() =>
                setStatusFilter(
                  statusFilter === "completed" ? "all" : "completed"
                )
              }
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "8px",
                cursor: "pointer",
                border: "none",
                background: "none",
                padding: "2px 0",
                opacity: statusFilter === "active" ? 0.4 : 1,
                transition: "opacity 0.2s",
              }}
            >
              <span
                style={{
                  width: 12,
                  height: 16,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="12" height="16" viewBox="0 0 12 16">
                  <path
                    d="M6 0C2.7 0 0 2.7 0 6c0 4.5 6 10 6 10s6-5.5 6-10c0-3.3-2.7-6-6-6z"
                    fill={PIN_COLORS.completed}
                  />
                  <circle cx="6" cy="6" r="2.5" fill="white" fillOpacity="0.9" />
                </svg>
              </span>
              <span style={{ fontSize: "12px", color: "#374859", fontWeight: 600 }}>
                Completed Projects
              </span>
              <span
                style={{
                  fontSize: "11px",
                  color: "#999",
                  fontWeight: 400,
                }}
              >
                ({completedCount})
              </span>
            </button>

            {/* Country fill legend */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                borderTop: "1px solid #e8e8e8",
                paddingTop: "6px",
              }}
            >
              <span
                style={{
                  width: 14,
                  height: 10,
                  background: COUNTRY_HIGHLIGHT,
                  border: "1px solid #9abb94",
                  borderRadius: "2px",
                  display: "inline-block",
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: "11px", color: "#999" }}>
                Countries where CfC has worked
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatYear(props: Record<string, any>): string {
  return props.startYear && props.startYear > 0
    ? props.endYear && props.endYear > 0
      ? props.startYear === props.endYear
        ? `${props.startYear}`
        : `${props.startYear}\u2013${props.endYear}`
      : `${props.startYear}\u2013Present`
    : "";
}

/** Full detail popup — photo placeholder, stats, type */
function buildPinnedPopupHTML(props: Record<string, any>): string {
  const isActive = props.status === "active";
  const statusColor = isActive ? PIN_COLORS.active : PIN_COLORS.completed;
  const statusLabel = isActive ? "Active" : "Completed";
  const yr = formatYear(props);
  const location = [props.city, props.country].filter(Boolean).join(", ");
  const imageSection = props.imageUrl
    ? `<div style="height:160px;position:relative">
        <img src="${props.imageUrl}" alt="${props.partner}" style="width:100%;height:100%;object-fit:cover" />
        <div style="position:absolute;top:10px;right:10px">
          <span style="display:inline-block;font-size:10px;padding:3px 10px;border-radius:9999px;color:white;background:${statusColor};font-weight:600">${statusLabel}</span>
        </div>
      </div>`
    : "";

  return `
    <div style="width:320px;border-radius:10px;background:white;box-shadow:0 6px 24px rgba(0,0,0,0.18);overflow:hidden;border:1px solid #d6d6d6;font-family:Lato,sans-serif">
      ${imageSection}
      <div style="padding:14px 16px">
        <div style="font-weight:700;font-size:16px;color:#374859;line-height:1.3">${props.partner}</div>
        ${props.details ? `<div style="font-size:13px;color:#666;margin-top:6px;line-height:1.4">${props.details}</div>` : ""}
        <div style="margin-top:12px;display:grid;grid-template-columns:1fr 1fr;gap:8px">
          ${location ? `
          <div style="background:#f8f7f4;border-radius:6px;padding:8px 10px">
            <div style="font-size:10px;color:#999;text-transform:uppercase;letter-spacing:0.5px">Location</div>
            <div style="font-size:13px;color:#374859;font-weight:600;margin-top:2px">${location}</div>
          </div>` : ""}
          ${yr ? `
          <div style="background:#f8f7f4;border-radius:6px;padding:8px 10px">
            <div style="font-size:10px;color:#999;text-transform:uppercase;letter-spacing:0.5px">Year</div>
            <div style="font-size:13px;color:#374859;font-weight:600;margin-top:2px">${yr}</div>
          </div>` : ""}
          ${props.type ? `
          <div style="background:#f8f7f4;border-radius:6px;padding:8px 10px">
            <div style="font-size:10px;color:#999;text-transform:uppercase;letter-spacing:0.5px">Sector</div>
            <div style="font-size:13px;color:#374859;font-weight:600;margin-top:2px">${props.type}</div>
          </div>` : ""}
          <div style="background:#f8f7f4;border-radius:6px;padding:8px 10px">
            <div style="font-size:10px;color:#999;text-transform:uppercase;letter-spacing:0.5px">Status</div>
            <div style="font-size:13px;font-weight:600;margin-top:2px;color:${statusColor}">${statusLabel}</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function attachMultiPopupListeners(popupEl: HTMLElement, propsList: Record<string, any>[]) {
  function bindRows() {
    popupEl.querySelectorAll<HTMLElement>("[data-project-idx]").forEach((row) => {
      row.addEventListener("pointerup", (e) => {
        e.stopPropagation();
        const idx = Number(row.dataset.projectIdx);
        const p = propsList[idx];
        if (!p) return;
        const content = popupEl.querySelector(".mapboxgl-popup-content");
        if (!content) return;
        const backBar = `
          <div data-back-btn style="padding:8px 14px;background:#374859;color:white;font-size:12px;cursor:pointer;display:flex;align-items:center;gap:6px;font-family:Lato,sans-serif">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
            All ${propsList.length} Projects
          </div>`;
        content.innerHTML = backBar + buildPinnedPopupHTML(p);
        bindBack();
      });
    });
  }

  function bindBack() {
    const backBtn = popupEl.querySelector<HTMLElement>("[data-back-btn]");
    if (backBtn) {
      backBtn.addEventListener("pointerup", (e) => {
        e.stopPropagation();
        const content = popupEl.querySelector(".mapboxgl-popup-content");
        if (!content) return;
        content.innerHTML = buildMultiPopupListHTML(propsList);
        bindRows();
      });
    }
  }

  bindRows();
}

function buildMultiPopupListHTML(propsList: Record<string, any>[]): string {
  const first = propsList[0];
  const items = propsList
    .map((p, i) => {
      const isActive = p.status === "active";
      const statusColor = isActive ? PIN_COLORS.active : PIN_COLORS.completed;
      const statusLabel = isActive ? "Active" : "Completed";
      return `
      <div data-project-idx="${i}" style="padding:10px 14px;border-bottom:1px solid #eee;cursor:pointer;transition:background 0.15s" onmouseenter="this.style.background='#f8f7f4'" onmouseleave="this.style.background='white'">
        <div style="font-weight:700;font-size:13px;color:#374859">${p.partner}</div>
        ${p.details ? `<div style="font-size:11px;color:#666;margin-top:2px">${p.details}</div>` : ""}
        <div style="margin-top:4px;display:flex;align-items:center;gap:4px">
          <span style="display:inline-block;font-size:9px;padding:1px 8px;border-radius:9999px;color:white;background:${statusColor}">${statusLabel}</span>
          ${p.type ? `<span style="display:inline-block;font-size:9px;padding:1px 8px;border-radius:9999px;color:#374859;background:#faf9f5;border:1px solid #d6d6d6">${p.type}</span>` : ""}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-left:auto;flex-shrink:0"><path d="m9 18 6-6-6-6"/></svg>
        </div>
      </div>`;
    })
    .join("");

  return `
    <div style="width:270px;max-height:350px;overflow-y:auto;border-radius:8px;background:white;box-shadow:0 4px 20px rgba(0,0,0,0.15);border:1px solid #d6d6d6;font-family:Lato,sans-serif">
      <div style="padding:10px 14px;background:#374859;color:white;font-weight:700;font-size:13px;position:sticky;top:0;z-index:1">
        ${propsList.length} Projects \u2014 ${first.city || first.country || ""}
      </div>
      ${items}
    </div>
  `;
}
