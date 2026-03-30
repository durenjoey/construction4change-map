export interface Hub {
  id: string;
  name: string;
  shortName: string;
  description: string;
  color: string;
  lightColor: string;
  hq: string;
  projectCount: number;
  /** Countries where CfC has completed/active projects */
  activeCountries: string[];
  /** ISO 3166-1 alpha-3 codes for active project countries */
  activeIsoCodes: string[];
  /** Broader region countries CfC can serve from this hub (ISO codes) */
  coverageIsoCodes: string[];
  highlights: string[];
}

export const HUBS: Hub[] = [
  {
    id: "north-america",
    name: "North America",
    shortName: "N. America",
    description:
      "From our Seattle headquarters to the Caribbean, this hub spans domestic projects supporting food banks, youth centers, and transitional housing, plus solar installations and school rebuilds across the Caribbean and Central America.",
    color: "#374859",
    lightColor: "#d0d8df",
    hq: "Seattle, WA",
    projectCount: 51,
    activeCountries: [
      "USA",
      "Puerto Rico",
      "USVI",
      "Tortola (BVI)",
      "Dominica",
      "Dominican Republic",
      "Haiti",
      "Honduras",
    ],
    activeIsoCodes: ["USA", "PRI", "VIR", "VGB", "DMA", "DOM", "HTI", "HND"],
    coverageIsoCodes: [
      "USA", "CAN", "MEX",
      "PRI", "VIR", "VGB", "DMA", "DOM", "HTI",
      "JAM", "TTO", "BRB", "GRD", "ATG", "KNA", "LCA", "VCT",
      "BLZ", "GTM", "HND", "SLV", "NIC", "CRI", "PAN",
    ],
    highlights: [
      "Pallet shelter villages for homeless communities",
      "Clinton Foundation & Expedia solar partnerships",
      "Post-hurricane school reconstruction in Dominica",
    ],
  },
  {
    id: "south-america",
    name: "South America",
    shortName: "S. America",
    description:
      "Community centers and healthcare facilities in Bolivia, including the Etta Community Center and IDH Health Clinic.",
    color: "#cb463a",
    lightColor: "#f0d2cf",
    hq: "Regional",
    projectCount: 3,
    activeCountries: ["Bolivia"],
    activeIsoCodes: ["BOL"],
    coverageIsoCodes: [
      "BOL", "COL", "ECU", "PER", "GUY", "SUR",
      "BRA", "ARG", "CHL", "PRY", "URY", "VEN",
    ],
    highlights: [
      "Etta Community Center in Buena Vista",
      "IDH Health Clinic in Cochabamba",
      "IDH COVID Testing Center",
    ],
  },
  {
    id: "west-africa",
    name: "West Africa",
    shortName: "W. Africa",
    description:
      "Our longest-running international partnership with Integrate Health spans 5 phases of healthcare facility construction across Togo, plus projects in Guinea, Guinea-Bissau, and Liberia.",
    color: "#a39965",
    lightColor: "#e8e2cb",
    hq: "Regional",
    projectCount: 10,
    activeCountries: ["Togo", "Guinea", "Guinea-Bissau", "Liberia"],
    activeIsoCodes: ["TGO", "GIN", "GNB", "LBR"],
    coverageIsoCodes: [
      "TGO", "GIN", "GNB", "LBR",
      "SEN", "GMB", "MLI", "BFA", "CIV", "GHA", "BEN", "NER", "NGA", "SLE",
      "CPV", "MRT",
    ],
    highlights: [
      "5-phase partnership with Integrate Health",
      "Healthcare clinics serving 100,000+ patients",
      "Mentee Education Foundation schools",
    ],
  },
  {
    id: "east-south-africa",
    name: "East & Southern Africa",
    shortName: "E. & S. Africa",
    description:
      "From Flying Kites schools in Kenya to Partners in Health facilities in Rwanda and Malawi, this hub represents our deepest portfolio of healthcare, education, and economic development projects.",
    color: "#174258",
    lightColor: "#c8d8e4",
    hq: "Regional",
    projectCount: 22,
    activeCountries: [
      "Kenya",
      "Uganda",
      "Rwanda",
      "Zambia",
      "Malawi",
      "South Africa",
      "South Sudan",
    ],
    activeIsoCodes: ["KEN", "UGA", "RWA", "ZMB", "MWI", "ZAF", "SSD"],
    coverageIsoCodes: [
      "KEN", "UGA", "RWA", "ZMB", "MWI", "ZAF",
      "TZA", "ETH", "SOM", "MOZ", "ZWE", "BWA", "NAM", "AGO",
      "COD", "COG", "BDI", "SSD", "MDG", "SWZ", "LSO",
    ],
    highlights: [
      "Flying Kites campus — schools, dorms, kitchens",
      "Partners in Health facilities in Rwanda & Malawi",
      "Matibabu & Tiba Foundation clinics",
    ],
  },
  {
    id: "asia-pacific",
    name: "Asia & Pacific",
    shortName: "Asia-Pacific",
    description:
      "Projects spanning South Asia to the Pacific Islands — from hospitals in India and women's protection centers in Nepal to schools in Cambodia and marine facilities in the Solomon Islands.",
    color: "#4a7c6f",
    lightColor: "#c8ddd8",
    hq: "Regional",
    projectCount: 5,
    activeCountries: ["India", "Cambodia", "Nepal", "Solomon Islands"],
    activeIsoCodes: ["IND", "KHM", "NPL", "SLB"],
    coverageIsoCodes: [
      "IND", "KHM", "NPL", "SLB",
      "BGD", "LKA", "MMR", "THA", "LAO", "VNM", "PHL",
      "IDN", "MYS", "PNG", "FJI", "TLS", "BTN",
    ],
    highlights: [
      "Hospital for Hope — medical clinic in Jharkhand",
      "Women's Protection Center in Nepal",
      "STEP school in Cambodia",
    ],
  },
];

/** Get all coverage ISO codes across all hubs */
export function getAllCoverageIsoCodes(): string[] {
  return HUBS.flatMap((h) => h.coverageIsoCodes);
}

/** Get hub by ISO code */
export function getHubForIsoCode(code: string): Hub | undefined {
  return HUBS.find((h) => h.coverageIsoCodes.includes(code));
}

/** Get active hub by ISO code */
export function getActiveHubForIsoCode(code: string): Hub | undefined {
  return HUBS.find((h) => h.activeIsoCodes.includes(code));
}
