import { ProjectMap } from "@/components/ProjectMap";
import projectData from "@/data/projects.json";
import { Project } from "@/lib/types";
import { enrichProjectsWithImages } from "@/lib/projectImages";

export default function Home() {
  const projects = enrichProjectsWithImages(projectData as Project[]);

  return <ProjectMap projects={projects} />;
}
