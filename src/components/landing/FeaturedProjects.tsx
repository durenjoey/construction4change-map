import Image from "next/image";
import type { FeaturedProject } from "@/lib/featuredProjects";
import { getTypeColor } from "@/lib/types";
import { Container, Cta, Eyebrow } from "./ui";

function meta(p: FeaturedProject): string {
  const place = [p.city, p.country].filter(Boolean).join(", ");
  return [place, p.year].filter(Boolean).join(" · ");
}

export function FeaturedProjects({ projects }: { projects: FeaturedProject[] }) {
  return (
    <section
      id="our-work"
      aria-labelledby="our-work-heading"
      className="bg-cfc-cream py-20 md:py-28"
    >
      <Container>
        <div className="max-w-3xl">
          <Eyebrow>Our Work</Eyebrow>
          <h2
            id="our-work-heading"
            className="mt-4 font-sans text-[34px] font-black leading-[1.1] tracking-tight text-cfc-slate md:text-[52px]"
          >
            Built to last, wherever the need is.
          </h2>
        </div>

        <ul className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => {
            const caption = meta(p);
            const altPlace = [p.city, p.country].filter(Boolean).join(", ");
            return (
              <li
                key={p.title}
                className="group relative aspect-[4/3] overflow-hidden bg-cfc-slate"
              >
                {p.imageUrl ? (
                  <Image
                    src={p.imageUrl}
                    alt={altPlace ? `${p.title}, ${altPlace}` : p.title}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 top-0 h-2"
                    style={{ backgroundColor: getTypeColor(p.type) }}
                  />
                )}
                <div
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-black/80 via-black/30 to-transparent"
                />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <h3 className="font-sans text-[19px] font-black leading-tight text-white">
                    {p.title}
                  </h3>
                  {caption && (
                    <p className="mt-1.5 font-heading text-[12px] uppercase tracking-[1.5px] text-white/80">
                      {caption}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        <div className="mt-12">
          <Cta href="/map" variant="primary">
            View All Our Projects
          </Cta>
        </div>
      </Container>
    </section>
  );
}
