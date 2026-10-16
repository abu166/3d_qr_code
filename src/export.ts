import QRCode from "qrcode";
import type { QrData } from "./qr";
import type { StudioConfig } from "./studio";
import type { Capture } from "./Scene";
function save(href: string, name: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = name;
  a.click();
}
export async function qrCanvas(
  qr: QrData,
  correction: StudioConfig["correction"],
) {
  const c = document.createElement("canvas");
  await QRCode.toCanvas(c, qr.url, {
    errorCorrectionLevel: correction,
    margin: 4,
    width: 1200,
    color: { dark: "#19271f", light: "#faf9f4" },
  });
  return c;
}
export async function exportStudio(
  kind: "png" | "svg" | "poster",
  qr: QrData,
  config: StudioConfig,
  capture: Capture | null,
  resolution: number,
) {
  if (kind === "svg") {
    const text = await QRCode.toString(qr.url, {
      type: "svg",
      margin: 4,
      errorCorrectionLevel: config.correction,
      color: { dark: "#19271f", light: "#faf9f4" },
    });
    const blob = URL.createObjectURL(
      new Blob([text], { type: "image/svg+xml" }),
    );
    save(blob, "verdant-qr.svg");
    setTimeout(() => URL.revokeObjectURL(blob), 1000);
    return;
  }
  if (kind === "png") {
    save((await qrCanvas(qr, config.correction)).toDataURL(), "verdant-qr.png");
    return;
  }
  if (!capture) throw new Error("3D renderer unavailable");
  const source = capture(resolution),
    canvas = document.createElement("canvas");
  canvas.width = 1200 * resolution;
  canvas.height = 1400 * resolution;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(resolution, resolution);
  ctx.fillStyle = config.lighting === "obsidian" ? "#171c21" : "#eeede8";
  ctx.fillRect(0, 0, 1200, 1400);
  const ratio = Math.min(1160 / source.width, 1100 / source.height);
  ctx.drawImage(
    source,
    600 - (source.width * ratio) / 2,
    20,
    source.width * ratio,
    source.height * ratio,
  );
  ctx.fillStyle = config.lighting === "obsidian" ? "#e9e9df" : "#383e39";
  ctx.font = "30px monospace";
  ctx.fillText("VERDANT STUDIO / BOTANICAL STUDY", 70, 1170);
  ctx.font = "20px monospace";
  ctx.fillText(new URL(qr.url).hostname, 70, 1220, 820);
  ctx.font = "16px monospace";
  ctx.fillText(
    `${config.design.toUpperCase()} · ${config.season.toUpperCase()} · SEED ${config.seed}`,
    70,
    1310,
  );
  ctx.drawImage(await qrCanvas(qr, config.correction), 960, 1170, 170, 170);
  save(canvas.toDataURL(), "verdant-studio-poster.png");
}
