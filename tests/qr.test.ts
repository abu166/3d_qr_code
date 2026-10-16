import { test } from "node:test";
import assert from "node:assert/strict";
import jsQR from "jsqr";
import { makeQr, validateUrl } from "../src/qr";
for (const url of [
  "https://example.com",
  "https://example.com/path?q=hello%20world&lang=日本語#section",
  `https://example.com/${"a".repeat(900)}`,
]) {
  test(`QR decodes exact input (${url.length} characters)`, () => {
    const qr = makeQr(url),
      scale = 5,
      width = (qr.size + 8) * scale;
    const image = new Uint8ClampedArray(width * width * 4).fill(255);
    for (const [x, y] of qr.points)
      for (let dy = 0; dy < scale; dy++)
        for (let dx = 0; dx < scale; dx++) {
          const p = (((y + 4) * scale + dy) * width + (x + 4) * scale + dx) * 4;
          image[p] = 52;
          image[p + 1] = 59;
          image[p + 2] = 40;
        }
    assert.equal(jsQR(image, width, width)?.data, url);
  });
}
test("rejects missing, malformed, unsafe, and excessive input", () => {
  for (const value of [
    "",
    "example.com",
    "javascript:alert(1)",
    "file:///etc/hosts",
    "https://example.com/" + "x".repeat(6000),
  ])
    assert.throws(() => makeQr(value));
});
test("preserves the exact entered URL, apart from surrounding whitespace", () =>
  assert.equal(
    validateUrl(" https://EXAMPLE.com/a%20b?q=1#z "),
    "https://EXAMPLE.com/a%20b?q=1#z",
  ));
test("Q correction retains exact payload and four-module quiet zone", () => {
  const url = "https://example.org/verdant?seed=42";
  const qr = makeQr(url, "Q"),
    scale = 8,
    width = (qr.size + 8) * scale,
    image = new Uint8ClampedArray(width * width * 4).fill(255);
  for (const [x, y] of qr.points)
    for (let dy = 0; dy < scale; dy++)
      for (let dx = 0; dx < scale; dx++) {
        const offset =
          (((y + 4) * scale + dy) * width + (x + 4) * scale + dx) * 4;
        image[offset] = 23;
        image[offset + 1] = 37;
        image[offset + 2] = 29;
      }
  assert.equal(jsQR(image, width, width)?.data, url);
  assert.ok(qr.kinds.includes("finder"));
  assert.ok(qr.kinds.includes("alignment"));
  assert.equal(qr.points.length, qr.kinds.length);
});
