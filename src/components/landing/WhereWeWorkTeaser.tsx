import type { Hub } from "@/lib/hubs";
import { Container, Cta, Eyebrow } from "./ui";

export function WhereWeWorkTeaser({ hubs }: { hubs: Hub[] }) {
  return (
    <section
      id="where-we-work"
      aria-labelledby="where-we-work-heading"
      className="bg-white py-20 md:py-28"
    >
      <Container>
        <div className="max-w-3xl">
          <Eyebrow>Where We Work</Eyebrow>
          <h2
            id="where-we-work-heading"
            className="mt-4 font-sans text-[34px] font-black leading-[1.1] tracking-tight text-cfc-slate md:text-[52px]"
          >
            Five regional hubs. One standard of work.
          </h2>
        </div>

        <ul className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {hubs.map((hub) => (
            <li
              key={hub.id}
              className="flex flex-col bg-cfc-cream transition-shadow hover:shadow-lg"
            >
              <span
                aria-hidden="true"
                className="block h-2 w-full"
                style={{ backgroundColor: hub.color }}
              />
              <div className="flex flex-1 flex-col p-6">
                <div className="flex items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: hub.color }}
                  />
                  <h3 className="font-sans text-[18px] font-black leading-tight text-cfc-slate">
                    {hub.name}
                  </h3>
                </div>
                <p className="mt-3 font-heading text-[13px] uppercase tracking-[2px] text-cfc-maroon">
                  {hub.projectCount} projects
                </p>
                <p className="mt-auto pt-4 text-[15px] leading-snug text-cfc-slate/75">
                  {hub.activeCountries.slice(0, 2).join(", ")}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-12">
          <Cta href="/where-we-work" variant="ghost">
            See the Regional Map
          </Cta>
        </div>
      </Container>
    </section>
  );
}
