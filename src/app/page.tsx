"use client";

import { ProjectMap } from "@/components/ProjectMap";
import projectData from "@/data/projects.json";
import { Project } from "@/lib/types";

export default function Home() {
  const projects = projectData as Project[];

  return <ProjectMap projects={projects} />;
}
