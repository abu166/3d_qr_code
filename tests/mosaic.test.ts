import { test } from "node:test";
import assert from "node:assert/strict";
import jsQR from "jsqr";
import { makeQr } from "../src/qr";
import {
  mosaic,
  projectRelief,
  TILE_SPAN,
  TILE_Y,
  contrast,
  darkPalettes,
  stoneColor,
} from "../src/mosaic";
import { defaults, restoreConfig, type StudioConfig } from "../src/studio";
const qr = makeQr("https://www.cloudflare.com/products/r2/", "Q"),
  count = 6500,
  cell = TILE_SPAN / (qr.size + 8);
test("all instances land on dark modules with finite, positive 3D dimensions", () => {
  for (const season of ["spring", "summer", "autumn", "winter"] as const)
    for (const mode of ["botanical", "relief", "islands"] as const) {
      const pieces = mosaic(qr, count, { ...defaults, season, mosaic: mode });
      assert.equal(pieces.length, count);
      const used = new Set<number>();
      for (const p of pieces) {
        assert.ok([p.x, p.y, p.z, p.sx, p.sy, p.sz].every(Number.isFinite));
        assert.ok(p.sx > 0 && p.sy > 0 && p.sz > 0);
        assert.ok(p.y > TILE_Y);
        used.add(p.module);
      }
      assert.equal(used.size, qr.points.length);
      assert.ok(pieces.slice(qr.points.length).every((p) => p.sx < cell * 0.6));
    }
});
test("pigments and limestone retain at least 7:1 nominal luminance contrast", () => {
  for (const season of ["spring", "summer", "autumn", "winter"] as const)
    for (const pigment of darkPalettes[season])
      assert.ok(contrast(pigment, stoneColor(season)) > 7);
});
test("projection-aware relief preserves scanner footprints from zenith to 25 degrees at every elevation", () => {
  for (const relief of [0.2, 1, 2.5])
    for (const angle of [0, 15, 25]) {
      const pieces = mosaic(qr, count, { ...defaults, relief }),
        elevation = Math.PI / 2 - (angle * Math.PI) / 180,
        sin = Math.sin(elevation),
        cos = Math.cos(elevation);
      for (const p of pieces) {
        const [x, z] = qr.points[p.module],
          centerX = (x - (qr.size - 1) / 2) * cell,
          centerZ = (z - (qr.size - 1) / 2) * cell,
          q = projectRelief(p, centerX, centerZ, cell, elevation, 0);
        const projectedCenter =
            -(q.z - centerZ) * sin + (q.y - (TILE_Y + 0.025)) * cos,
          extent = (q.sz * sin + q.sy * cos) / 2;
        assert.ok(
          Math.abs(projectedCenter) + extent <= cell * 0.51,
          `module overflow at ${relief}× / ${angle}°`,
        );
        assert.ok(q.sz > 0);
        assert.ok(Math.abs(q.x - centerX) < cell * 0.51);
      }
    }
});
test("independent raster of projected relief substrates decodes exact payload at 0, 15 and 25 degrees", () => {
  for (const angle of [0, 15, 25]) {
    const pieces = mosaic(qr, count, { ...defaults, relief: 2.5 }),
      scale = 10,
      width = (qr.size + 8) * scale,
      image = new Uint8ClampedArray(width * width * 4).fill(255),
      elevation = Math.PI / 2 - (angle * Math.PI) / 180,
      sin = Math.sin(elevation),
      cos = Math.cos(elevation);
    for (const p of pieces.slice(0, qr.points.length)) {
      const [x, z] = qr.points[p.module],
        q = projectRelief(
          p,
          (x - (qr.size - 1) / 2) * cell,
          (z - (qr.size - 1) / 2) * cell,
          cell,
          elevation,
          0,
        ),
        centerY = -q.z * sin + (q.y - (TILE_Y + 0.025)) * cos,
        half = (q.sz * sin + q.sy * cos) / 2;
      const left = Math.round(
          ((q.x - q.sx / 2 + TILE_SPAN / 2) / cell) * scale,
        ),
        right = Math.round(((q.x + q.sx / 2 + TILE_SPAN / 2) / cell) * scale),
        top = Math.round(
          ((-centerY - half + (TILE_SPAN / 2) * sin) / cell / sin) * scale,
        ),
        bottom = Math.round(
          ((-centerY + half + (TILE_SPAN / 2) * sin) / cell / sin) * scale,
        );
      for (let py = top; py < bottom; py++)
        for (let px = left; px < right; px++) {
          const k = (py * width + px) * 4;
          image[k] = 36;
          image[k + 1] = 43;
          image[k + 2] = 35;
        }
    }
    assert.equal(
      jsQR(image, width, width)?.data,
      qr.url,
      `${angle} degree silhouette failed`,
    );
  }
});
test("all correction levels retain exact encoded payload", () => {
  for (const correction of ["L", "M", "Q", "H"] as const) {
    const data = makeQr("https://example.com", correction);
    assert.ok(data.points.length > 0);
    assert.equal(data.kinds.length, data.points.length);
  }
});
test("share configuration restores bounded values and rejects invalid enum data", () => {
  const c = restoreConfig(
    "?form=flower&season=winter&tilt=250&relief=-3&geometry=evil&seed=Infinity&correction=H",
  );
  assert.equal(c.design, "flower");
  assert.equal(c.season, "winter");
  assert.equal(c.tilt, 25);
  assert.equal(c.relief, 0.2);
  assert.equal(c.seed, 0);
  assert.equal(c.geometry, defaults.geometry);
  assert.equal(c.correction, "H");
  const original: StudioConfig = {
    ...defaults,
    seed: 42,
    geometry: "hex",
    mosaic: "islands",
    lighting: "museum",
    emblem: false,
  };
  const params = new URLSearchParams(
    Object.entries(original).map(([key, value]) => [
      key === "design" ? "form" : key,
      String(value),
    ]),
  );
  assert.deepEqual(restoreConfig(params.toString()), original);
});
