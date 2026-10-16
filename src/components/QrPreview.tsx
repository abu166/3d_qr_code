import type { QrData } from "../qr";
export function QrPreview({
  qr,
  hover = null,
}: {
  qr: QrData;
  hover?: number | null;
}) {
  return (
    <svg
      viewBox={`-4 -4 ${qr.size + 8} ${qr.size + 8}`}
      shapeRendering="crispEdges"
      role="img"
      aria-label={`QR matrix encoding ${qr.url}`}
    >
      <rect
        x="-4"
        y="-4"
        width={qr.size + 8}
        height={qr.size + 8}
        fill="#faf9f4"
      />
      <path
        fill="#24342c"
        d={qr.points.map(([x, y]) => `M${x},${y}h1v1h-1z`).join("")}
      />
      {hover !== null && qr.points[hover] && (
        <rect
          x={qr.points[hover][0]}
          y={qr.points[hover][1]}
          width="1"
          height="1"
          fill="#c76936"
        />
      )}
    </svg>
  );
}
