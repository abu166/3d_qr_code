import type { Design, Season } from "./sculptures";
export type Correction = "L" | "M" | "Q" | "H";
export type StudioConfig = {
  design: Design;
  season: Season;
  seed: number;
  density: number;
  curvature: number;
  geometry: "chamfer" | "pebble" | "leaf" | "hex";
  mosaic: "botanical" | "relief" | "islands";
  relief: number;
  tilt: number;
  finder: "blossom" | "timber" | "crystal";
  emblem: boolean;
  correction: Correction;
  wind: number;
  turbulence: boolean;
  plinth: "limestone" | "terrarium" | "slate" | "grid";
  particles: "pollen" | "petals" | "fireflies" | "off";
  lighting: "daylight" | "obsidian" | "sunset" | "museum";
};
export const defaults: StudioConfig = {
  design: "flower",
  season: "spring",
  seed: 0,
  density: 0.78,
  curvature: 0.65,
  geometry: "chamfer",
  mosaic: "botanical",
  relief: 1,
  tilt: 18,
  finder: "blossom",
  emblem: true,
  correction: "Q",
  wind: 0.3,
  turbulence: false,
  plinth: "limestone",
  particles: "pollen",
  lighting: "daylight",
};
export const forms = [
  { id: "tree", label: "Ancient Tree", sub: "Branch / canopy" },
  { id: "flower", label: "Botanical Bloom", sub: "Calyx / 3 petal tiers" },
  { id: "crystal", label: "Crystal Cluster", sub: "Hexagonal mineral" },
  { id: "bonsai", label: "Zen Bonsai", sub: "Cascade / moss" },
] as const;
export const seasons = ["spring", "summer", "autumn", "winter"] as const;
export const presets = [
  {
    id: "r2",
    label: "Cloudflare R2 Demo",
    url: "https://www.cloudflare.com/products/r2/",
    design: "crystal",
    season: "winter",
  },
  {
    id: "github",
    label: "GitHub Profile",
    url: "https://github.com",
    design: "tree",
    season: "summer",
  },
  {
    id: "portfolio",
    label: "Portfolio",
    url: "https://example.com/portfolio",
    design: "flower",
    season: "spring",
  },
  {
    id: "launch",
    label: "Product Launch",
    url: "https://example.com/launch",
    design: "bonsai",
    season: "autumn",
  },
] as const;
export function restoreConfig(search: string) {
  const p = new URLSearchParams(search),
    config = { ...defaults };
  for (const key of Object.keys(defaults) as (keyof StudioConfig)[]) {
    const raw = p.get(key === "design" ? "form" : key);
    if (raw === null) continue;
    const base = defaults[key];
    if (typeof base === "number") {
      const n = Number(raw);
      if (Number.isFinite(n)) (config as Record<string, unknown>)[key] = n;
    } else if (typeof base === "boolean")
      (config as Record<string, unknown>)[key] = raw === "true";
    else {
      const allowed: Record<string, readonly string[]> = {
        design: forms.map((f) => f.id),
        season: seasons,
        geometry: ["chamfer", "pebble", "leaf", "hex"],
        mosaic: ["botanical", "relief", "islands"],
        finder: ["blossom", "timber", "crystal"],
        correction: ["L", "M", "Q", "H"],
        plinth: ["limestone", "terrarium", "slate", "grid"],
        particles: ["pollen", "petals", "fireflies", "off"],
        lighting: ["daylight", "obsidian", "sunset", "museum"],
      };
      if (allowed[key]?.includes(raw))
        (config as Record<string, unknown>)[key] = raw;
    }
  }
  config.seed = Math.max(0, Math.floor(config.seed)) % 4294967296;
  config.density = Math.max(0.2, Math.min(1, config.density));
  config.curvature = Math.max(0, Math.min(1, config.curvature));
  config.relief = Math.max(0.2, Math.min(2.5, config.relief));
  config.tilt = Math.max(0, Math.min(25, config.tilt));
  config.wind = Math.max(0, Math.min(1, config.wind));
  return config;
}
