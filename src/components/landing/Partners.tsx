import { Container, Eyebrow } from "./ui";

const PARTNER_ROWS: { label: string; names: string[] }[] = [
  { label: "Corporate", names: ["Estate Four", "SMACNA", "Dowbuilt"] },
  {
    label: "Granting",
    names: ["MJ Murdock Charitable Trust", "Talem Foundation"],
  },
  {
    label: "In-kind",
    names: ["6B Workshop", "Adaptiv", "HDR", "Synchronic Services"],
  },
];

export function Partners() {
  return (
    <section
      id="partners"
      aria-labelledby="partners-heading"
      className="bg-white py-16 md:py-20"
    >
      <Container>
        <Eyebrow>
          <span id="partners-heading">Our Partners</span>
        </Eyebrow>
        <div className="mt-8 divide-y divide-cfc-gray-light border-y border-cfc-gray-light">
          {PARTNER_ROWS.map((row) => (
            <div
              key={row.label}
              className="grid gap-3 py-5 md:grid-cols-[160px_1fr] md:items-center md:gap-6"
            >
              <p className="font-heading text-[13px] uppercase tracking-[2px] text-cfc-gray-mid">
                {row.label}
              </p>
              <ul className="flex flex-wrap gap-2.5">
                {row.names.map((name) => (
                  <li
                    key={name}
                    className="border border-cfc-gray-light px-4 py-2 font-heading text-[14px] uppercase tracking-[1.5px] text-cfc-slate"
                  >
                    {name}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
