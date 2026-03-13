import { ScrollShowcase } from "@/components/ScrollShowcase";
import projectData from "@/data/projects.json";
import { Project } from "@/lib/types";

export default function Home() {
  const projects = projectData as Project[];

  return <ScrollShowcase projects={projects} />;
}
