import { test } from "node:test";
import assert from "node:assert/strict";
import { sculpture, type Design, type Season } from "../src/sculptures";
const forms: Design[] = ["tree", "flower", "crystal", "bonsai"],
  seasons: Season[] = ["spring", "summer", "autumn", "winter"];
test("all sixteen botanical combinations produce finite, bounded geometry", () => {
  for (const form of forms)
    for (const season of seasons) {
      const pieces = sculpture(form, season, 6500, "https://example.com:42");
      assert.equal(pieces.length, 6500);
      for (const p of pieces) {
        assert.ok([p.x, p.y, p.z, p.scale, p.rx, p.rz].every(Number.isFinite));
        assert.ok(p.scale > 0);
        assert.ok(Math.abs(p.x) < 4 && Math.abs(p.y) < 4 && Math.abs(p.z) < 4);
      }
    }
});
test("URL and variation seed deterministically change the growth", () => {
  for (const form of forms) {
    const a = sculpture(form, "spring", 100, "https://example.com:0");
    assert.deepEqual(
      a,
      sculpture(form, "spring", 100, "https://example.com:0"),
    );
    assert.notDeepEqual(
      a,
      sculpture(form, "spring", 100, "https://example.org:0"),
    );
    assert.notDeepEqual(
      a,
      sculpture(form, "spring", 100, "https://example.com:1"),
    );
  }
});
test("bloom has curved stem, broad leaves, raised seed head, and curved petal layers", () => {
  const p = sculpture("flower", "spring", 6500, "botanical");
  const stem = p.filter((v) => v.part === "stem"),
    leaves = p.filter((v) => v.part === "leaf"),
    core = p.filter((v) => v.part === "core"),
    petals = p.filter((v) => v.part === "petal");
  assert.ok(
    Math.max(...stem.map((v) => v.x)) - Math.min(...stem.map((v) => v.x)) > 0.4,
  );
  assert.ok(Math.max(...leaves.map((v) => Math.hypot(v.x, v.z))) > 1);
  assert.ok(core.every((v) => v.y >= 1));
  assert.ok(
    Math.max(...petals.map((v) => v.y)) - Math.min(...petals.map((v) => v.y)) >
      0.45,
  );
});
