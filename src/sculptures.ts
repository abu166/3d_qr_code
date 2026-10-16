export type Design = "tree" | "flower" | "crystal" | "bonsai";
export type Season = "spring" | "summer" | "autumn" | "winter";
export const palettes: Record<Season, string[]> = {
  spring: ["#eaa9b7", "#f8d4d5", "#c77394", "#a4b97b", "#718b58"],
  summer: ["#426f42", "#6e9953", "#a7bc6c", "#33553b", "#d3c980"],
  autumn: ["#cd7138", "#e9aa4c", "#a74b32", "#f4c76c", "#8e6039"],
  winter: ["#c8dfe2", "#f0f7ed", "#8baeb3", "#547e7c", "#a9c9c8"],
};
export type Particle = {
  x: number;
  y: number;
  z: number;
  scale: number;
  color: string;
  rx: number;
  rz: number;
  part?: "stem" | "leaf" | "core" | "petal" | "sepal";
};
export function hash(value: string) {
  let h = 2166136261;
  for (const c of value) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}
export function sculpture(
  design: Design,
  season: Season,
  count: number,
  seed = "verdant",
  dna = { density: 0.78, curvature: 0.65 },
): Particle[] {
  let state = hash(seed);
  const rnd = () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const colors = palettes[season],
    phase = rnd() * 6.28,
    branches = 7,
    heights = Array.from({ length: 8 }, () => 1.4 + rnd() * 1.5);
  return Array.from({ length: count }, (_, i) => {
    let x = 0,
      y = 0,
      z = 0,
      scale = 0.08 + rnd() * 0.045,
      color = colors[i % 5],
      rx = rnd() * 0.6,
      rz = rnd() * 1.2;
    const u = i / count;
    let part: Particle["part"];
    if (design === "flower") {
      const bend = (t: number) =>
        Math.sin(t * 5) * (0.12 + dna.curvature * 0.3);
      if (u < 0.09) {
        part = "stem";
        const t = rnd(),
          a = rnd() * Math.PI * 2,
          r = 0.026 * Math.sqrt(rnd());
        x = bend(t) + Math.cos(a) * r;
        y = -2 + t * 2.9;
        z = 0.08 * Math.sin(t * 3) + Math.sin(a) * r;
        scale = 0.07;
        color = "#506540";
      } else if (u < 0.22) {
        part = "leaf";
        const leaf = i % 3,
          t = rnd(),
          a = leaf * 2.35 + phase,
          w = (rnd() - 0.5) * Math.sin(Math.PI * t) * 0.8,
          r = t * (0.95 + leaf * 0.1);
        x = bend(0.2 + leaf * 0.18) + Math.cos(a) * r + Math.sin(a) * w;
        z = Math.sin(a) * r - Math.cos(a) * w;
        y =
          -1.55 +
          leaf * 0.48 +
          Math.sin(t * Math.PI) * 0.4 +
          t * 0.32 -
          Math.abs(w) * 0.13;
        scale = 0.075;
        color = ["#4d6b43", "#718b53", "#8ca365"][i % 3];
        rx = Math.sin(a) * 0.5;
        rz = -Math.cos(a) * 0.5;
      } else if (u < 0.28) {
        part = "sepal";
        const a = ((i % 7) * Math.PI * 2) / 7,
          t = rnd(),
          r = 0.12 + t * 0.53;
        x = bend(1) + Math.cos(a) * r;
        z = 0.08 * Math.sin(3) + Math.sin(a) * r;
        y = 0.77 + Math.sin(t * Math.PI) * 0.15 - t * 0.16;
        scale = 0.09;
        color = ["#466440", "#6b8450", "#81995e"][i % 3];
      } else if (u < 0.4) {
        part = "core";
        const t = Math.max(0, Math.min(1, (u - 0.28) / 0.12)),
          a = i * 2.399963,
          r = Math.sqrt(t) * 0.39;
        x = bend(1) + Math.cos(a) * r;
        z = 0.08 * Math.sin(3) + Math.sin(a) * r;
        y = 1.32 + 0.55 * Math.sqrt(1 - t);
        scale = 0.065;
        color = ["#b98d3f", "#e5c16d", "#80652d"][i % 3];
      } else {
        part = "petal";
        const tier = i % 3,
          n = [10, 14, 18][tier],
          petal = Math.floor(i / 3) % n,
          a = (petal * Math.PI * 2) / n + tier * 0.81 + phase,
          t = rnd(),
          v = rnd() * 2 - 1;
        const length = [1.05, 1.5, 1.9][tier],
          angle = [1.13, 0.67, 0.17][tier],
          width =
            [0.26, 0.39, 0.46][tier] * Math.pow(Math.sin(Math.PI * t), 0.7),
          r = 0.23 + Math.cos(angle) * length * t;
        x = bend(1) + Math.cos(a) * r + Math.sin(a) * v * width;
        z = 0.08 * Math.sin(3) + Math.sin(a) * r - Math.cos(a) * v * width;
        y =
          0.89 +
          Math.sin(angle) * length * t +
          Math.sin(Math.PI * t) * (0.1 + dna.curvature * 0.23) -
          Math.pow(t, 3) * [0.02, 0.27, 0.65][tier] +
          v * v * 0.11;
        scale = (0.103 + rnd() * 0.014) * (0.84 + dna.density * 0.35);
        rx = Math.sin(a) * angle;
        rz = -Math.cos(a) * angle;
        color =
          season === "summer"
            ? ["#e6c578", "#f1d89e", "#c89f55"][tier]
            : colors[tier];
      }
    } else if (design === "crystal") {
      const k = i % 8,
        a = k * 2.399 + phase,
        t = rnd(),
        h = k === 0 ? 4.3 : heights[k],
        r = (k === 0 ? 0.48 : 0.3) * (t > 0.72 ? (1 - t) / 0.28 : 1),
        side = (Math.floor(rnd() * 6) * Math.PI) / 3,
        edge = rnd();
      x =
        Math.cos(a) * (k === 0 ? 0 : 0.85 + t * 0.45) +
        r * (Math.cos(side) * (1 - edge) + Math.cos(side + Math.PI / 3) * edge);
      z =
        Math.sin(a) * (k === 0 ? 0 : 0.85 + t * 0.45) +
        r * (Math.sin(side) * (1 - edge) + Math.sin(side + Math.PI / 3) * edge);
      y = -2 + t * h;
      scale = 0.095;
      rx = 0;
      rz = 0;
      color = (
        season === "spring"
          ? ["#c093b6", "#cfc5dc", "#f0d4db", "#8c879e", "#d8b8d5"]
          : season === "autumn"
            ? ["#b98450", "#ebc08a", "#f0d7ab", "#a36e45", "#dba76a"]
            : ["#72a7ab", "#a8d7cd", "#d1e9dc", "#527e94", "#e2c9ba"]
      )[i % 5];
    } else {
      const cascade = design === "bonsai",
        bend = (t: number) =>
          cascade ? Math.sin(t * 2.3) * 1.1 : Math.sin(t * 2) * 0.3;
      if (u < 0.24) {
        const t = rnd(),
          a = rnd() * 6.28;
        if (u < 0.07) {
          const r = rnd() * 0.85;
          x = Math.cos(a) * r;
          z = Math.sin(a) * r;
          y = -1.98 + 0.22 * (1 - r);
          scale = 0.13;
        } else if (u < 0.15) {
          const r = (0.18 * (1 - t) + 0.04) * Math.sqrt(rnd());
          x = bend(t) + Math.cos(a) * r;
          z = Math.sin(a) * r;
          y = -2 + t * 3.35;
          scale = 0.12;
        } else {
          const k = i % branches,
            b = k * 2.399 + phase,
            t = rnd(),
            r = t * (1.05 + k * 0.045);
          x = bend(0.6) + Math.cos(b) * r;
          z = Math.sin(b) * r;
          y = -0.5 + k * 0.24 + t * 0.55;
          scale = 0.1 * (1 - t * 0.5);
        }
        color =
          season === "winter"
            ? "#a5a99b"
            : ["#654c37", "#826047", "#9a7957"][i % 3];
      } else {
        const k = i % branches,
          a = k * 2.399 + phase,
          r = 1.05 + k * 0.045,
          theta = rnd() * 6.28,
          v = rnd() * 2 - 1,
          d = Math.cbrt(rnd()),
          width = cascade ? 0.82 : 0.88;
        x =
          bend(0.6) +
          Math.cos(a) * r +
          Math.cos(theta) * Math.sqrt(1 - v * v) * d * width;
        z =
          Math.sin(a) * r + Math.sin(theta) * Math.sqrt(1 - v * v) * d * width;
        y = 0.05 + k * 0.24 + v * d * 0.58;
        if (cascade) y -= Math.max(0, x) * 0.38;
        scale = 0.085 + rnd() * 0.06;
      }
    }
    if (design !== "flower") {
      x *= 0.8 + dna.curvature * 0.3;
      if (u > 0.24 && design !== "crystal") {
        scale *= 0.65 + dna.density * 0.48;
        y += (dna.curvature - 0.5) * Math.sin(x * 2) * 0.15;
      }
    }
    return { x, y, z, scale, color, rx, rz, part };
  });
}
