import projectData from "@/data/projects.json";
import { Project } from "@/lib/types";
import { enrichProjectsWithImages } from "@/lib/projectImages";
import { HUBS } from "@/lib/hubs";
import { getFeaturedProjects } from "@/lib/featuredProjects";
import { NavBar } from "@/components/NavBar";
import { HeroGlobe } from "@/components/HeroGlobe";
import { StatsStrip } from "@/components/landing/StatsStrip";
import { WhoWeAre } from "@/components/landing/WhoWeAre";
import { WhatWeDo } from "@/components/landing/WhatWeDo";
import { WhereWeWorkTeaser } from "@/components/landing/WhereWeWorkTeaser";
import { FeaturedProjects } from "@/components/landing/FeaturedProjects";
import { WhyItMatters } from "@/components/landing/WhyItMatters";
import { Partners } from "@/components/landing/Partners";
import { FinalCta } from "@/components/landing/FinalCta";
import { SiteFooter } from "@/components/landing/SiteFooter";

export default function Home() {
  const projects = enrichProjectsWithImages(projectData as Project[]);
  const featured = getFeaturedProjects(projects);

  return (
    <>
      <NavBar />
      <main className="overflow-x-clip">
        <HeroGlobe
          projects={projects}
          tagline="BUILD WELL. CHANGE EVERYTHING."
          headline="Your mission deserves a building that matches it."
          subheadline="From the ground up, we create a lasting space for positive change."
          primaryCta={{ label: "Explore Our Projects", href: "/map" }}
          secondaryCta={{ label: "Build With Us", href: "/form" }}
          showLogo={false}
        />
        <StatsStrip />
        <WhoWeAre />
        <WhatWeDo />
        <WhereWeWorkTeaser hubs={HUBS} />
        <FeaturedProjects projects={featured} />
        <WhyItMatters />
        <Partners />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}
