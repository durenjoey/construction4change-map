import Image from "next/image";

export function WhyItMatters() {
  return (
    <section
      id="why-it-matters"
      aria-labelledby="why-it-matters-heading"
      className="relative isolate overflow-hidden bg-cfc-slate-dark py-28 text-white md:py-40"
    >
      <Image
        src="/projects/20.jpg"
        alt="Flying Kites dormitory at dusk, Njabini, Kenya"
        fill
        sizes="100vw"
        className="-z-20 object-cover"
      />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-cfc-slate/80" />

      <div className="mx-auto w-full max-w-4xl px-5 text-center md:px-8">
        <h2
          id="why-it-matters-heading"
          className="font-sans text-[34px] font-black leading-[1.1] tracking-tight md:text-[56px]"
        >
          A school without a safe building is not really a school.
        </h2>
        <p className="mt-8 text-[18px] leading-relaxed text-white/90 md:text-[20px]">
          A clinic without proper infrastructure cannot deliver proper care.
          The gap between the work these organizations are trying to do and
          the facilities they have to do it in is the gap Construction for
          Change exists to close.
        </p>
        <p className="mt-6 text-[17px] leading-relaxed text-white/80 md:text-[18px]">
          These are not just construction projects. They are the classrooms
          where the next generation learns, the clinics where mothers deliver
          safely, the workshops where women build economic independence. For
          18 years, we have shown up for the organizations doing this work,
          across 23 countries on four continents, through every challenge a
          construction project can throw at us. We intend to keep showing up.
        </p>
      </div>
    </section>
  );
}
