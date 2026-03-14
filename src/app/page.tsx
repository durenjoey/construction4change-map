"use client";

import { useState } from "react";
import { ScrollShowcase } from "@/components/ScrollShowcase";
import { ProjectMap } from "@/components/ProjectMap";
import projectData from "@/data/projects.json";
import { Project } from "@/lib/types";

export default function Home() {
  const projects = projectData as Project[];
  const [mode, setMode] = useState<"showcase" | "interactive">("showcase");

  return (
    <div>
      {/* Fixed toggle tab */}
      <div
        style={{
          position: "fixed",
          top: 16,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 20,
          display: "flex",
          background: "rgba(0,0,0,0.5)",
          borderRadius: "9999px",
          padding: "3px",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,0.15)",
        }}
      >
        <button
          onClick={() => setMode("showcase")}
          style={{
            padding: "8px 20px",
            borderRadius: "9999px",
            fontSize: "13px",
            fontWeight: 700,
            border: "none",
            background: mode === "showcase" ? "#cb463a" : "transparent",
            color: mode === "showcase" ? "white" : "rgba(255,255,255,0.6)",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          Showcase
        </button>
        <button
          onClick={() => setMode("interactive")}
          style={{
            padding: "8px 20px",
            borderRadius: "9999px",
            fontSize: "13px",
            fontWeight: 700,
            border: "none",
            background: mode === "interactive" ? "#cb463a" : "transparent",
            color: mode === "interactive" ? "white" : "rgba(255,255,255,0.6)",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          Interactive Map
        </button>
      </div>

      {mode === "showcase" ? (
        <ScrollShowcase projects={projects} />
      ) : (
        <ProjectMap projects={projects} />
      )}
    </div>
  );
}
