import projectData from "@/data/projects.json";
import { Project } from "@/lib/types";
import { enrichProjectsWithImages } from "@/lib/projectImages";

/** The demo project used across the card preview pages (has a photo). */
export function getDemoProject(): Project {
  const projects = enrichProjectsWithImages(projectData as Project[]);
  return { ...projects.find((p) => p.id === "121")! };
}

/** Centered, shareable single-card stage on a neutral background. */
export function CardStage({
  title,
  note,
  html,
}: {
  title: string;
  note: string;
  html: string;
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 18,
        background: "#e9eef2",
        padding: 40,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: "#374859" }}>{title}</div>
        <div style={{ fontSize: 13, color: "#777", marginTop: 2 }}>{note}</div>
      </div>
      <div dangerouslySetInnerHTML={{ __html: html }} />
      <a href="/cards" style={{ fontSize: 12, color: "#901a1d", textDecoration: "none" }}>
        ← see all options
      </a>
    </div>
  );
}
