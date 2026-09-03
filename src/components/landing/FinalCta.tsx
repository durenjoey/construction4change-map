import { Container, Cta } from "./ui";

export function FinalCta() {
  return (
    <section
      id="build-with-us"
      aria-labelledby="build-with-us-heading"
      className="bg-cfc-red py-20 text-white md:py-24"
    >
      <Container className="flex flex-col items-center text-center">
        <h2
          id="build-with-us-heading"
          className="font-sans text-[40px] font-black leading-none tracking-tight md:text-[64px]"
        >
          Build with us.
        </h2>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Cta href="/form" variant="outline-white">
            Build With Us
          </Cta>
          <Cta
            href="https://www.constructionforchange.org/ways-to-give/"
            variant="outline-white"
          >
            Fund A Build
          </Cta>
          <Cta
            href="https://www.constructionforchange.org/opportunities-for-you/"
            variant="outline-white"
          >
            Join The Team
          </Cta>
        </div>
      </Container>
    </section>
  );
}
