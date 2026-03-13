"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Project, PROJECT_TYPES, ProjectType, getTypeColor } from "@/lib/types";
import { ProjectCard } from "./ProjectCard";
import { Badge } from "@/components/ui/badge";
import { MapPin, Globe, Calendar, Building2, X } from "lucide-react";

interface ProjectMapProps {
  projects: Project[];
}

export function ProjectMap({ projects }: ProjectMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [activeFilter, setActiveFilter] = useState<ProjectType>("All");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const filteredProjects = projects.filter((p) => {
    if (!p.lat || !p.lng) return false;
    if (activeFilter === "All") return true;
    return p.type === activeFilter;
  });

  // Stats
  const totalProjects = projects.length;
  const countries = new Set(projects.map((p) => p.country).filter(Boolean)).size;
  const yearRange = `${Math.min(...projects.filter((p) => p.startYear).map((p) => p.startYear!))}–${Math.max(...projects.filter((p) => p.startYear).map((p) => p.startYear!))}`;

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const clearMarkers = useCallback(() => {
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    if (popupRef.current) {
      popupRef.current.remove();
      popupRef.current = null;
    }
  }, []);

  const addMarkers = useCallback(
    (mapInstance: mapboxgl.Map, projectList: Project[]) => {
      clearMarkers();

      // Group projects by location to handle overlapping pins
      const locationGroups: Record<string, Project[]> = {};
      projectList.forEach((p) => {
        const key = `${p.lat?.toFixed(3)},${p.lng?.toFixed(3)}`;
        if (!locationGroups[key]) locationGroups[key] = [];
        locationGroups[key].push(p);
      });

      Object.entries(locationGroups).forEach(([, group]) => {
        const primary = group[0];
        if (!primary.lat || !primary.lng) return;

        const color = getTypeColor(primary.type);
        const count = group.length;

        // Create marker element
        const el = document.createElement("div");
        el.className = "cfc-marker";
        el.style.cssText = `
          width: ${count > 1 ? 28 : 22}px;
          height: ${count > 1 ? 28 : 22}px;
          background: ${color};
          border: 2px solid white;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          transition: transform 0.15s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 700;
          color: white;
        `;
        if (count > 1) {
          el.textContent = String(count);
        }
        el.addEventListener("mouseenter", () => {
          el.style.transform = "scale(1.3)";
        });
        el.addEventListener("mouseleave", () => {
          el.style.transform = "scale(1)";
        });

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([primary.lng!, primary.lat!])
          .addTo(mapInstance);

        el.addEventListener("click", (e) => {
          e.stopPropagation();

          if (isMobile) {
            setSelectedProject(group.length === 1 ? group[0] : group[0]);
            mapInstance.flyTo({
              center: [primary.lng!, primary.lat!],
              zoom: Math.max(mapInstance.getZoom(), 6),
              duration: 800,
            });
          } else {
            // Remove existing popup
            if (popupRef.current) popupRef.current.remove();

            const popupContent = document.createElement("div");
            popupContent.className = "cfc-popup";

            if (group.length === 1) {
              const p = group[0];
              const typeColor = getTypeColor(p.type);
              const yearRange = p.startYear
                ? p.endYear
                  ? `${p.startYear} - ${p.endYear}`
                  : `${p.startYear} - Present`
                : "";
              popupContent.innerHTML = `
                <div style="width:280px;border-radius:8px;background:white;box-shadow:0 4px 20px rgba(0,0,0,0.15);overflow:hidden;border:1px solid #d6d6d6">
                  <div style="height:6px;background:${typeColor}"></div>
                  <div style="padding:14px">
                    <p style="font-weight:700;font-size:14px;color:#374859;line-height:1.3;margin:0">${p.partner}</p>
                    ${p.details ? `<p style="font-size:12px;color:#999;margin:4px 0 0">${p.details}</p>` : ""}
                    <div style="display:flex;align-items:center;gap:12px;margin-top:8px;font-size:11px;color:#999">
                      ${p.city ? `<span>${p.city}${p.country ? `, ${p.country}` : ""}</span>` : ""}
                      ${yearRange ? `<span>${yearRange}</span>` : ""}
                    </div>
                    <div style="margin-top:8px">
                      <span style="display:inline-block;font-size:10px;padding:2px 8px;border-radius:9999px;color:white;background:${typeColor}">${p.type}</span>
                    </div>
                  </div>
                </div>
              `;
            } else {
              const items = group
                .map((p) => {
                  const tc = getTypeColor(p.type);
                  return `
                  <div style="padding:10px 14px;border-bottom:1px solid #eee">
                    <p style="font-weight:700;font-size:13px;color:#374859;margin:0">${p.partner}</p>
                    ${p.details ? `<p style="font-size:11px;color:#999;margin:2px 0 0">${p.details}</p>` : ""}
                    <span style="display:inline-block;font-size:10px;padding:1px 6px;border-radius:9999px;color:white;background:${tc};margin-top:4px">${p.type}</span>
                  </div>`;
                })
                .join("");
              popupContent.innerHTML = `
                <div style="width:280px;max-height:350px;overflow-y:auto;border-radius:8px;background:white;box-shadow:0 4px 20px rgba(0,0,0,0.15);border:1px solid #d6d6d6">
                  <div style="padding:10px 14px;background:#374859;color:white;font-weight:700;font-size:13px;position:sticky;top:0">
                    ${group.length} Projects — ${primary.city || primary.country}
                  </div>
                  ${items}
                </div>
              `;
            }

            const popup = new mapboxgl.Popup({
              closeOnClick: true,
              maxWidth: "none",
              offset: 15,
            })
              .setLngLat([primary.lng!, primary.lat!])
              .setDOMContent(popupContent)
              .addTo(mapInstance);

            popupRef.current = popup;

            mapInstance.flyTo({
              center: [primary.lng!, primary.lat!],
              zoom: Math.max(mapInstance.getZoom(), 5),
              duration: 800,
            });
          }
        });

        markersRef.current.push(marker);
      });
    },
    [clearMarkers, isMobile]
  );

  // Init map
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

    const mapInstance = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [20, 5],
      zoom: 2,
      minZoom: 1.5,
      maxZoom: 15,
      attributionControl: true,
    });

    mapInstance.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      "top-right"
    );

    mapInstance.on("load", () => {
      addMarkers(mapInstance, filteredProjects);
    });

    // Close popup on map click
    mapInstance.on("click", () => {
      if (popupRef.current) {
        popupRef.current.remove();
        popupRef.current = null;
      }
      setSelectedProject(null);
    });

    map.current = mapInstance;

    return () => {
      clearMarkers();
      mapInstance.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update markers when filter changes
  useEffect(() => {
    if (!map.current || !map.current.loaded()) return;
    addMarkers(map.current, filteredProjects);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter, addMarkers]);

  const filterCounts = PROJECT_TYPES.map((type) => ({
    type,
    count:
      type === "All"
        ? projects.filter((p) => p.lat && p.lng).length
        : projects.filter((p) => p.lat && p.lng && p.type === type).length,
  }));

  return (
    <div className="flex flex-col h-screen w-full bg-white">
      {/* Header */}
      <header className="border-b border-cfc-gray-light bg-white px-4 md:px-6 py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-lg md:text-xl font-black text-cfc-slate tracking-wide">
              CONSTRUCTION FOR CHANGE
            </h1>
            <p className="text-xs text-cfc-gray-mid tracking-wider uppercase font-light">
              Global Project Map
            </p>
          </div>
          {/* Stats */}
          <div className="flex items-center gap-4 md:gap-6">
            <div className="flex items-center gap-1.5 text-sm">
              <Building2 className="w-4 h-4 text-cfc-red" />
              <span className="font-bold text-cfc-slate">{totalProjects}</span>
              <span className="text-cfc-gray-mid text-xs hidden sm:inline">
                Projects
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <Globe className="w-4 h-4 text-cfc-red" />
              <span className="font-bold text-cfc-slate">{countries}</span>
              <span className="text-cfc-gray-mid text-xs hidden sm:inline">
                Countries
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <Calendar className="w-4 h-4 text-cfc-red" />
              <span className="font-bold text-cfc-slate">{yearRange}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Filter Bar */}
      <div className="border-b border-cfc-gray-light bg-cfc-cream px-4 md:px-6 py-2.5">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {filterCounts
            .filter((f) => f.count > 0)
            .map(({ type, count }) => (
              <button
                key={type}
                onClick={() => setActiveFilter(type)}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold
                  whitespace-nowrap transition-all duration-150
                  ${
                    activeFilter === type
                      ? "bg-cfc-slate text-white shadow-sm"
                      : "bg-white text-cfc-slate border border-cfc-gray-light hover:border-cfc-slate"
                  }
                `}
              >
                {type !== "All" && (
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{
                      backgroundColor: getTypeColor(type === "All" ? null : type),
                    }}
                  />
                )}
                {type}
                <span className="text-[10px] opacity-60">{count}</span>
              </button>
            ))}
        </div>
      </div>

      {/* Map */}
      <div className="relative flex-1">
        <div ref={mapContainer} className="absolute inset-0" />

        {/* Mobile detail panel */}
        {isMobile && selectedProject && (
          <div className="absolute bottom-0 left-0 right-0 z-10 p-3 bg-white/95 backdrop-blur border-t border-cfc-gray-light">
            <button
              onClick={() => setSelectedProject(null)}
              className="absolute top-2 right-2 p-1 rounded-full bg-cfc-cream hover:bg-cfc-gray-light"
            >
              <X className="w-4 h-4 text-cfc-slate" />
            </button>
            <ProjectCard project={selectedProject} />
          </div>
        )}
      </div>
    </div>
  );
}
