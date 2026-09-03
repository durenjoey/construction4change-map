import Image from "next/image";
import { Container, Cta, Eyebrow } from "./ui";

export function WhoWeAre() {
  return (
    <section
      id="who-we-are"
      aria-labelledby="who-we-are-heading"
      className="overflow-x-clip bg-white py-20 md:py-28"
    >
      <Container className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
        <div>
          <Eyebrow>Who We Are</Eyebrow>
          <h2
            id="who-we-are-heading"
            className="mt-4 font-sans text-[30px] font-black leading-[1.15] tracking-tight text-cfc-slate md:text-[40px]"
          >
            We are a nonprofit construction management organization with an
            uncommon belief: that expert construction should be available to
            every community, everywhere.
          </h2>
          <div className="mt-7 space-y-5 text-[17px] leading-relaxed text-cfc-slate/85">
            <p>
              For 18 years, Construction for Change has mobilized world-class
              architects, engineers, and project managers to build schools,
              clinics, maternal health facilities, and community centers in
              underserved communities across Africa, Asia, and the Americas.
              We don&apos;t just build facilities. We serve as the expert
              advocate, the owner&apos;s representative, for NGOs who should
              not have to navigate the complexity of capital construction
              alone.
            </p>
            <p>
              We operate through regional hubs in East Africa, West Africa,
              and the Americas, each led by a dedicated regional director with
              locally-hired project managers who know the terrain, the
              culture, and the community. Every project is community-driven,
              locally staffed, and built to last long after we leave.
            </p>
          </div>
          <blockquote className="mt-9 border-l-4 border-cfc-red pl-6 font-sans text-xl font-bold leading-snug text-cfc-maroon md:text-[22px]">
            We practice what we preach. Our project managers are local to the
            regions we build in, because we believe the people building better
            communities should represent those communities.
          </blockquote>
          <div className="mt-10">
            <Cta
              href="https://www.constructionforchange.org/our-story/"
              variant="ghost"
            >
              Our Story
            </Cta>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[600px] lg:mx-0 lg:justify-self-end">
          <div
            aria-hidden="true"
            className="absolute inset-0 translate-x-4 translate-y-4 bg-cfc-red md:translate-x-6 md:translate-y-6"
          />
          <div className="relative aspect-[4/3] overflow-hidden shadow-2xl">
            <Image
              src="/projects/21.jpg"
              alt="Flying Kites classroom block, Njabini, Kenya"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </Container>
    </section>
  );
}
