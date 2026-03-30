export interface Project {
  id: string | null;
  partner: string;
  country: string | null;
  city: string | null;
  lat: number | null;
  lng: number | null;
  type: string | null;
  details: string | null;
  startYear: number | null;
  endYear: number | null;
  status: "completed" | "active";
  imageUrl?: string | null;
}

export const PROJECT_TYPES = [
  "All",
  "Healthcare",
  "Education",
  "Housing",
  "Economic",
  "Food Security",
  "WASH",
] as const;

export type ProjectType = (typeof PROJECT_TYPES)[number];

export const TYPE_COLORS: Record<string, string> = {
  Healthcare: "#e8872e",
  Education: "#374859",
  Housing: "#901a1d",
  Economic: "#174258",
  "Food Security": "#2d3940",
  WASH: "#4a7c6f",
};

export function getTypeColor(type: string | null): string {
  return TYPE_COLORS[type || ""] || "#999999";
}
