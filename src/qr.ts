import QRCode from "qrcode";
export function validateUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed)
    throw new Error("Plant a link first. Enter a full website URL.");
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error("Please enter a full URL, like https://example.com");
  }
  if (!["http:", "https:"].includes(url.protocol) || !url.hostname)
    throw new Error("Use a website link beginning with https:// or http://");
  return trimmed;
}
export function makeQr(value: string, correction: "L" | "M" | "Q" | "H" = "Q") {
  const url = validateUrl(value);
  try {
    const { modules } = QRCode.create(url, {
      errorCorrectionLevel: correction,
    });
    const points: [number, number][] = [];
    for (let y = 0; y < modules.size; y++)
      for (let x = 0; x < modules.size; x++)
        if (modules.get(y, x)) points.push([x, y]);
    return {
      url,
      size: modules.size,
      points,
      kinds: points.map(([x, y]) => moduleKind(modules.size, x, y)),
    };
  } catch {
    throw new Error(
      "This link is too long for a QR code. Please use a shorter URL.",
    );
  }
}
export type QrData = ReturnType<typeof makeQr>;
export const qrOptions = {
  errorCorrectionLevel: "M" as const,
  margin: 4,
  scale: 16,
  color: { dark: "#343b28", light: "#f6f3eb" },
};

export type ModuleKind = "finder" | "alignment" | "timing" | "data";
export function moduleKind(size: number, x: number, y: number): ModuleKind {
  if ((x < 7 && y < 7) || (x >= size - 7 && y < 7) || (x < 7 && y >= size - 7))
    return "finder";
  const version = (size - 17) / 4;
  if (version > 1) {
    const count = Math.floor(version / 7) + 2,
      step =
        version === 32
          ? 26
          : Math.floor((version * 4 + count * 2 + 1) / (2 * count - 2)) * 2,
      centers = [6];
    for (let i = count - 2; i >= 0; i--) centers.push(size - 7 - i * step);
    for (const cx of centers)
      for (const cy of centers) {
        if (
          (cx === 6 && cy === 6) ||
          (cx === 6 && cy === size - 7) ||
          (cx === size - 7 && cy === 6)
        )
          continue;
        if (Math.abs(x - cx) <= 2 && Math.abs(y - cy) <= 2) return "alignment";
      }
  }
  return x === 6 || y === 6 ? "timing" : "data";
}
