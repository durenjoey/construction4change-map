import { CheckCircle2, ShieldCheck, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Container, Cta, Eyebrow } from "./ui";

interface Pillar {
  icon: LucideIcon;
  title: string;
  body: string;
}

const PILLARS: Pillar[] = [
  {
    icon: ShieldCheck,
    title: "Expert Advocacy",
    body: "We represent your interests, not the contractor's, at every phase of the project. You get a dedicated construction expert in your corner from design through ribbon-cutting.",
  },
  {
    icon: Users,
    title: "Local Partnership",
    body: "Every CfC project is designed and delivered with local architects, local contractors, and local labor at the center. We do not parachute in. We build with communities, not for them.",
  },
  {
    icon: CheckCircle2,
    title: "Accountable Delivery",
    body: "126 completed projects across 23 countries. We know how to build in complex environments, on budget, on time, and built to last.",
  },
];

export function WhatWeDo() {
  return (
    <section
      id="what-we-do"
      aria-labelledby="what-we-do-heading"
      className="bg-cfc-slate py-20 text-white md:py-28"
    >
      <Container>
        <div className="max-w-3xl">
          <Eyebrow onDark>What We Do</Eyebrow>
          <h2
            id="what-we-do-heading"
            className="mt-4 font-sans text-[34px] font-black leading-[1.1] tracking-tight md:text-[52px]"
          >
            We manage the build. You change the world.
          </h2>
          <p className="mt-7 text-[17px] leading-relaxed text-white/80">
            Capital construction projects are complex, risky, and expensive,
            and most nonprofits were not built to manage them. A stalled
            project does not just waste money. It delays the services your
            community is waiting for. Construction for Change serves as your
            owner&apos;s representative from day one. We manage architects,
            engineers, contractors, budgets, and timelines on your behalf,
            with your mission as the only priority.
          </p>
        </div>

        <ul className="mt-14 grid gap-6 md:grid-cols-3">
          {PILLARS.map(({ icon: Icon, title, body }) => (
            <li
              key={title}
              className="border border-white/10 bg-white/[0.04] p-8 transition-colors hover:bg-white/[0.07]"
            >
              <span className="inline-flex h-12 w-12 items-center justify-center bg-cfc-red text-white">
                <Icon size={24} aria-hidden="true" />
              </span>
              <h3 className="mt-6 font-sans text-[22px] font-black leading-tight">
                {title}
              </h3>
              <p className="mt-3 text-[16px] leading-relaxed text-white/75">
                {body}
              </p>
            </li>
          ))}
        </ul>

        <div className="mt-14">
          <Cta href="/form" variant="primary">
            Let&apos;s Talk About Your Project
          </Cta>
        </div>
      </Container>
    </section>
  );
}
