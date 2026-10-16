import { hash, type Design, type Season } from "./sculptures";
import type { QrData } from "./qr";
import type { StudioConfig } from "./studio";
export const TILE_SPAN = 4.8;
export const TILE_Y = -2.015;
export const darkPalettes: Record<Season, string[]> = {
  spring: ["#302b38", "#3d2939", "#203329", "#392d31"],
  summer: ["#193126", "#283829", "#29342b", "#302f22"],
  autumn: ["#38231e", "#462822", "#352c21", "#412331"],
  winter: ["#202e35", "#293b3d", "#302f3e", "#253430"],
};
export function luminance(hex: string) {
  const rgb = hex
    .replace("#", "")
    .match(/../g)!
    .map((v) => parseInt(v, 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}
export function contrast(dark: string, light = "#faf9f4") {
  return (luminance(light) + 0.05) / (luminance(dark) + 0.05);
}
export type MosaicPiece = {
  x: number;
  y: number;
  z: number;
  sx: number;
  sy: number;
  sz: number;
  rx: number;
  rz: number;
  color: string;
  wave: number;
  module: number;
};
export function mosaic(
  qr: QrData,
  count: number,
  config: StudioConfig,
): MosaicPiece[] {
  const cell = TILE_SPAN / (qr.size + 8),
    occupied = new Set(qr.points.map(([x, y]) => `${x},${y}`));
  let central = 0,
    best = Infinity;
  qr.points.forEach(([x, y], i) => {
    const d = Math.hypot(x - qr.size / 2, y - qr.size / 2);
    if (d < best) {
      best = d;
      central = i;
    }
  });
  const palette = darkPalettes[config.season];
  return Array.from({ length: count }, (_, i) => {
    const index = i % qr.points.length,
      [x, z] = qr.points[index],
      layer = Math.floor(i / qr.points.length),
      layers = Math.floor((count - 1 - index) / qr.points.length) + 1,
      noise = (hash(`${config.seed}:${i}`) % 1000) / 1000;
    const kind = qr.kinds[index],
      protectedModule =
        kind === "finder" || kind === "alignment" || kind === "timing";
    const finderCore =
      (x === 3 && z === 3) ||
      (x === qr.size - 4 && z === 3) ||
      (x === 3 && z === qr.size - 4);
    const baseHeight =
      cell *
      (0.18 + config.relief * 0.34) *
      (protectedModule ? 1.05 : 0.85 + noise * 0.22);
    let px = (x - (qr.size - 1) / 2) * cell,
      pz = (z - (qr.size - 1) / 2) * cell,
      sy = baseHeight,
      sx = cell * 0.995,
      sz = cell * 0.995,
      y = TILE_Y + 0.025 + sy / 2,
      rx = 0,
      rz = 0,
      wave = 0;
    let color = palette[index % palette.length];
    if (layer > 0) {
      const side = Math.max(2, Math.ceil(Math.sqrt(layers - 1))),
        slot = layer - 1,
        cx = slot % side,
        cz = Math.floor(slot / side),
        spread = cell / side;
      px += (cx - (side - 1) / 2) * spread;
      pz += (cz - (side - 1) / 2) * spread;
      sx = spread * 0.91;
      sz = spread * 0.91;
      sy = cell * (0.14 + config.relief * 0.19) * (0.6 + noise * 0.65);
      y = TILE_Y + 0.025 + baseHeight + sy / 2;
      color = palette[(index + layer) % palette.length];
      if (config.mosaic === "relief") {
        sy *= 0.55 + noise * 0.8;
        sx *= 0.96;
        sz *= 0.96;
      }
      if (config.mosaic === "islands") {
        const neighbors =
          Number(occupied.has(`${x + 1},${z}`)) +
          Number(occupied.has(`${x - 1},${z}`)) +
          Number(occupied.has(`${x},${z + 1}`)) +
          Number(occupied.has(`${x},${z - 1}`));
        sy *= neighbors > 1 ? 0.7 : 1.2;
        sx *= 1.02;
        sz *= 1.02;
      }
      if (config.mosaic === "botanical") {
        rx = (noise - 0.5) * 0.08;
        rz = (noise - 0.5) * 0.08;
        wave = protectedModule ? 0 : cell * 0.008;
      }
      if (protectedModule && config.finder === "timber") {
        sy *= 0.7;
        color = ["#30231d", "#3a2b21"][layer % 2];
      }
      if (protectedModule && config.finder === "crystal") {
        sy *= 1.2;
        sx *= 0.88;
        sz *= 0.88;
        color = ["#252536", "#28313d"][layer % 2];
      }
      if (
        (finderCore && layer === Math.ceil(layers / 2)) ||
        (config.emblem && index === central && layer > layers * 0.6)
      ) {
        color = config.design === "crystal" ? "#36304b" : "#584020";
        sy *= 1.4;
        sx *= 0.75;
        sz *= 0.75;
      }
    }
    if (layer === 0 && config.mosaic === "islands") {
      sx = cell * 1.005;
      sz = cell * 1.005;
    }
    if (layer > 0) y = TILE_Y + 0.025 + baseHeight + sy / 2;
    return { x: px, y, z: pz, sx, sy, sz, rx, rz, color, wave, module: index };
  });
}
export function stoneColor(season: Season) {
  return season === "winter" ? "#f7faf9" : "#faf9f4";
}
export function mineralColor(design: Design, season: Season) {
  return design === "crystal"
    ? season === "autumn"
      ? "#5c3429"
      : "#2c3e48"
    : darkPalettes[season][0];
}

// Compensate height in the camera's ground-plane projection. At steeper views,
// towers narrow in depth so their full silhouette stays inside the encoded cell.
// The result is real extruded geometry, with a stable scanner-facing footprint.
export function projectRelief(
  piece: MosaicPiece,
  centerX: number,
  centerZ: number,
  cell: number,
  elevation: number,
  azimuth: number,
  wind = 0,
) {
  const slope = Math.max(
      0,
      Math.cos(elevation) / Math.max(0.1, Math.sin(elevation)),
    ),
    depth = Math.max(cell * 0.035, piece.sz - piece.sy * slope),
    footprint = depth + piece.sy * slope;
  const inset = Math.min(cell * 0.49, footprint / 2),
    z = Math.max(
      centerZ - cell * 0.495 + inset,
      Math.min(centerZ + cell * 0.495 - inset, piece.z),
    );
  const y = piece.y + wind * piece.wave,
    height = y - (TILE_Y + 0.025);
  return {
    x: piece.x - height * slope * Math.sin(azimuth),
    y,
    z: z + height * slope * Math.cos(azimuth),
    sx: piece.sx,
    sy: piece.sy,
    sz: depth,
  };
}
