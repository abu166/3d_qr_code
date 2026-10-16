import React, { useCallback, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowDownToLine,
  ArrowUpRight,
  Check,
  ChevronDown,
  Copy,
  Dices,
  Focus,
  Info,
  Lock,
  RotateCcw,
  ScanLine,
  SlidersHorizontal,
  Sprout,
  Sun,
  View,
  Wind,
} from "lucide-react";
import jsQR from "jsqr";
import { Scene, type Capture } from "./Scene";
import { makeQr, validateUrl } from "./qr";
import { hash } from "./sculptures";
import {
  defaults,
  forms,
  presets,
  restoreConfig,
  type StudioConfig,
} from "./studio";
import { exportStudio, qrCanvas } from "./export";
import { Inspector } from "./components/Inspector";
import { QrPreview } from "./components/QrPreview";
import { Modal } from "./components/ui/Modal";
import { Picker, Popover, Segmented } from "./components/ui/Controls";
import { AudioToggle } from "./components/ui/AudioToggle";
import "./style.css";
const search = new URLSearchParams(location.search),
  initialConfig = restoreConfig(location.search),
  initialUrl = (() => {
    try {
      return validateUrl(
        search.get("url") || "https://www.cloudflare.com/products/r2/",
      );
    } catch {
      return "https://example.com";
    }
  })();
function decodeRender(image: ImageData) {
  const direct = jsQR(image.data, image.width, image.height);
  if (direct) return direct;
  // Studio shadows and bevel highlights can defeat adaptive thresholding.
  // Retry the same rendered pixels with global luminance thresholds.
  for (const threshold of [90, 130, 170]) {
    const pixels = new Uint8ClampedArray(image.data);
    for (let i = 0; i < pixels.length; i += 4) {
      const value =
        pixels[i] * 0.2126 + pixels[i + 1] * 0.7152 + pixels[i + 2] * 0.0722;
      pixels[i] = pixels[i + 1] = pixels[i + 2] = value < threshold ? 0 : 255;
      pixels[i + 3] = 255;
    }
    const result = jsQR(pixels, image.width, image.height);
    if (result) return result;
  }
  return null;
}

function App() {
  const [config, setConfig] = useState<StudioConfig>(initialConfig),
    [input, setInput] = useState(initialUrl),
    [qr, setQr] = useState(() => makeQr(initialUrl, initialConfig.correction)),
    [error, setError] = useState(""),
    [flat, setFlat] = useState(false),
    [progress, setProgress] = useState(0),
    [rotation, setRotation] = useState(0),
    [hover, setHover] = useState<number | null>(null),
    [stats, setStats] = useState({ fps: 0, count: 6500 }),
    [scanStatus, setScanStatus] = useState<
      "idle" | "checking" | "verified" | "failed"
    >("idle"),
    [notice, setNotice] = useState(""),
    [modal, setModal] = useState(""),
    [resolution, setResolution] = useState("2"),
    [busy, setBusy] = useState(false);
  const capture = useRef<Capture | null>(null),
    gesture = useRef({ x: 0, start: 0, moved: false }),
    hoverTime = useRef(0),
    reduced = useRef(
      matchMedia("(prefers-reduced-motion: reduce)").matches,
    ).current;
  const update = useCallback((patch: Partial<StudioConfig>) => {
    setConfig((c) => ({ ...c, ...patch }));
    setScanStatus("idle");
  }, []);
  const toggle = useCallback(() => {
    if (!gesture.current.moved) {
      setFlat((v) => !v);
      setScanStatus("idle");
    }
  }, []);
  const onStats = useCallback(
      (fps: number, count: number) => setStats({ fps, count }),
      [],
    ),
    onMorph = useCallback((value: number) => setProgress(value), []),
    onHover = useCallback((index: number | null) => {
      if (index === null || performance.now() - hoverTime.current > 75) {
        hoverTime.current = performance.now();
        setHover(index);
      }
    }, []);
  const form = forms.find((f) => f.id === config.design)!;
  const synced = !error && input.trim() === qr.url;
  useEffect(() => {
    const id = setTimeout(() => {
      try {
        setQr(makeQr(input, config.correction));
        setError("");
        setScanStatus("idle");
      } catch (e) {
        setError((e as Error).message);
      }
    }, 350);
    return () => clearTimeout(id);
  }, [input, config.correction]);
  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(""), 4500);
    return () => clearTimeout(id);
  }, [notice]);
  async function scan(silent = false) {
    if (flat && progress < 1) {
      if (!silent) setNotice("Wait for the mosaic to finish assembling.");
      return;
    }
    setScanStatus("checking");
    try {
      const canvas =
          flat && capture.current
            ? capture.current(1, true)
            : await qrCanvas(qr, config.correction),
        ctx = canvas.getContext("2d")!,
        image = ctx.getImageData(0, 0, canvas.width, canvas.height),
        result = decodeRender(image),
        valid = result?.data === qr.url;
      setScanStatus(valid ? "verified" : "failed");
      if (!silent)
        setNotice(
          valid
            ? `${flat ? "Rendered 3D mosaic" : "2D matrix"} verified: exact URL decoded.`
            : "This view did not decode. Reduce relief or snap to zenith, then verify again.",
        );
    } catch {
      setScanStatus("failed");
      if (!silent) setNotice("Verification unavailable for this render.");
    }
  }
  useEffect(() => {
    if (!flat || progress !== 1) return;
    const id = setTimeout(() => void scan(true), 650);
    return () => clearTimeout(id);
  }, [flat, progress, qr, config]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        (e.target as HTMLElement).closest(
          "input,textarea,dialog,button,summary",
        ) ||
        e.ctrlKey ||
        e.metaKey ||
        e.altKey
      )
        return;
      if (e.code === "Space") {
        e.preventDefault();
        setFlat((v) => !v);
        setScanStatus("idle");
      }
      if (e.key.toLowerCase() === "r") {
        setRotation(0);
        update({ tilt: 0 });
      }
      if (e.key.toLowerCase() === "s") void scan();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [qr, config, flat, progress, update]);
  async function share() {
    const url = new URL(location.href);
    url.search = "";
    url.searchParams.set("url", qr.url);
    for (const [key, value] of Object.entries(config))
      url.searchParams.set(key === "design" ? "form" : key, String(value));
    history.replaceState(null, "", url);
    try {
      await navigator.clipboard.writeText(url.href);
      setNotice("Configuration link copied.");
    } catch {
      setNotice("Configuration saved to the address bar.");
    }
  }
  async function download(kind: "png" | "svg" | "poster") {
    if (progress > 0 && progress < 1) {
      setNotice("Wait for the current morph to finish.");
      return;
    }
    setBusy(true);
    try {
      await exportStudio(kind, qr, config, capture.current, Number(resolution));
      setNotice("Export downloaded.");
    } catch (e) {
      setNotice((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className={`studio-app lighting-${config.lighting}`}>
      <div className="workspace-grid" />
      <div
        className="stage"
        onPointerDown={(e) => {
          gesture.current = { x: e.clientX, start: rotation, moved: false };
        }}
        onPointerMove={(e) => {
          if (e.buttons && !flat) {
            const dx = e.clientX - gesture.current.x;
            if (Math.abs(dx) > 4) gesture.current.moved = true;
            setRotation(gesture.current.start + dx * 0.006);
          }
        }}
        aria-label="3D botanical workspace"
      >
        <Scene
          qr={qr}
          config={config}
          flat={flat}
          reduced={reduced}
          rotation={rotation}
          onToggle={toggle}
          onStats={onStats}
          onMorph={onMorph}
          onHover={onHover}
          captureRef={capture}
          fallback={
            <div className="renderer-fallback">
              <QrPreview qr={qr} />
              <p>WebGL unavailable. The 2D QR remains exportable.</p>
            </div>
          }
        />
      </div>
      <header className="studio-header">
        <div className="header-brand">
          <span className="brand-symbol">
            <Sprout size={17} />
          </span>
          <strong>
            Verdant<span> Studio</span>
          </strong>
          <code>v2.4</code>
        </div>
        <Popover label="Presets" icon={<SlidersHorizontal size={13} />}>
          <div className="popover-label">QUICK PRESETS</div>
          {presets.map((p) => (
            <button
              className="preset-item"
              key={p.id}
              onClick={(e) => {
                setInput(p.url);
                update({ design: p.design, season: p.season });
                e.currentTarget.closest("details")?.removeAttribute("open");
              }}
            >
              <span>
                {p.label}
                <small>{new URL(p.url).hostname}</small>
              </span>
              <ArrowUpRight size={13} />
            </button>
          ))}
        </Popover>
        <div className={`command-bar ${error ? "invalid" : ""}`}>
          <Lock size={13} />
          <input
            aria-label="Destination URL"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setScanStatus("idle");
            }}
            spellCheck={false}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                try {
                  setQr(makeQr(input, config.correction));
                  setError("");
                } catch (err) {
                  setError((err as Error).message);
                }
              }
            }}
          />
          <span className="seed-pill" title={`Growth variation ${config.seed}`}>
            <code>
              #
              {hash(qr.url + config.seed)
                .toString(16)
                .toUpperCase()
                .padStart(8, "0")}
            </code>
            <button
              aria-label="Roll growth seed"
              title="Roll structural variation"
              onClick={() => update({ seed: (config.seed + 1) % 4294967296 })}
            >
              <Dices size={14} />
            </button>
          </span>
          <span className={`sync-status ${synced ? "synced" : ""}`}>
            {synced ? <Check size={12} /> : <span className="sync-dot" />}
            <span>{synced ? "QR Synced" : "Editing"}</span>
          </span>
        </div>
        <div className="environment-bar">
          <Popover label="Lighting" icon={<Sun size={15} />}>
            <div className="popover-label">STUDIO LIGHTING</div>
            <Picker
              label="Studio lighting"
              value={config.lighting}
              onChange={(lighting) => update({ lighting })}
              options={[
                {
                  id: "daylight",
                  label: "Warm Daylight",
                  description: "Alabaster museum",
                  icon: <span className="lighting-swatch daylight" />,
                },
                {
                  id: "obsidian",
                  label: "Botanical Dark",
                  description: "Obsidian workspace",
                  icon: <span className="lighting-swatch obsidian" />,
                },
                {
                  id: "sunset",
                  label: "Sunset Golden Hour",
                  icon: <span className="lighting-swatch sunset" />,
                },
                {
                  id: "museum",
                  label: "Museum Spotlight",
                  icon: <span className="lighting-swatch museum" />,
                },
              ]}
            />
          </Popover>
          <Popover
            label={stats.fps ? `${stats.fps} FPS` : "GPU"}
            icon={<span className="hardware-led" />}
          >
            <div className="popover-label">RENDER TELEMETRY</div>
            <dl className="telemetry-list">
              <dt>Frame rate</dt>
              <dd>{stats.fps} FPS</dd>
              <dt>Botanical instances</dt>
              <dd>{stats.count.toLocaleString()}</dd>
              <dt>QR modules</dt>
              <dd>
                {qr.size} × {qr.size}
              </dd>
              <dt>Dark modules</dt>
              <dd>{qr.points.length}</dd>
              <dt>Instancing</dt>
              <dd>WebGL 2</dd>
            </dl>
          </Popover>
        </div>
        <button className="export-cta" onClick={() => setModal("export")}>
          <ArrowDownToLine size={14} />
          <span>Export Studio</span>
        </button>
      </header>
      {error && (
        <div className="url-error" role="alert">
          {error}
        </div>
      )}
      <div className="workspace-title">
        <span className="crosshair">+</span>
        <span>
          BOTANICAL WORKSPACE
          <strong>
            {form.label} <i>/</i> {config.season}
          </strong>
        </span>
      </div>
      <div className="axis-gizmo" aria-label="Camera orientation">
        <button
          className="axis-y"
          title="Zenith view"
          aria-label="Snap to zenith"
          onClick={() => {
            setFlat(true);
            setRotation(0);
            update({ tilt: 0 });
          }}
        >
          Y
        </button>
        <button
          className="axis-x"
          title="Rotate sculpture"
          aria-label="Rotate sculpture"
          onClick={() => setRotation((v) => v + Math.PI / 4)}
        >
          X
        </button>
        <button
          className="axis-z"
          title="Tilt QR to 15 degrees"
          aria-label="Tilt QR to 15 degrees"
          onClick={() => {
            setFlat(true);
            update({ tilt: 15 });
          }}
        >
          Z
        </button>
        <span />
      </div>
      <Inspector
        config={config}
        onChange={update}
        flat={flat}
        onFlat={() => setFlat(true)}
      />
      <aside className="mini-map">
        <div className="mini-map-title">
          <span>
            <ScanLine size={13} /> LIVE QR MATRIX
          </span>
          <span className="hardware-led" />
        </div>
        <button
          className="qr-map-button"
          aria-label="Transform sculpture and botanical QR"
          onClick={() => {
            setFlat((v) => !v);
            setScanStatus("idle");
          }}
        >
          <QrPreview qr={qr} hover={hover} />
          <span>
            <View size={13} />{" "}
            {flat ? "Return to sculpture" : "Inspect 3D mosaic"}
          </span>
        </button>
        <div className="mini-meta">
          <span>
            {qr.size} × {qr.size} MATRIX
          </span>
          <span>ECC {config.correction}</span>
        </div>
        <div className="map-coordinate">
          {hover === null ? (
            <>
              <span>SPECIMEN</span>
              {form.label}
            </>
          ) : (
            <>
              <span>MODULE {hover.toString().padStart(4, "0")}</span>X{" "}
              {qr.points[hover]?.[0]} / Y {qr.points[hover]?.[1]}
            </>
          )}
        </div>
        <button
          className={`verify-button ${scanStatus}`}
          onClick={() => {
            if (flat && scanStatus === "failed" && config.tilt > 0)
              update({ tilt: 0 });
            else void scan();
          }}
        >
          <ScanLine size={13} />
          {scanStatus === "checking"
            ? "Decoding…"
            : scanStatus === "verified"
              ? flat
                ? "3D render verified"
                : "2D matrix verified"
              : scanStatus === "failed"
                ? config.tilt > 0
                  ? "Snap to zenith & verify"
                  : "Recheck 3D render"
                : "Scan test / verify"}
          {scanStatus === "verified" && <Check size={12} />}
        </button>
      </aside>
      <div className="view-dock">
        <Segmented
          label="Workspace view"
          value={flat ? "qr" : "sculpture"}
          onChange={(v) => {
            setFlat(v === "qr");
            setScanStatus("idle");
          }}
          options={[
            {
              id: "sculpture",
              label: (
                <>
                  <Sprout size={15} /> Sculpture
                </>
              ),
            },
            {
              id: "qr",
              label: (
                <>
                  <ScanLine size={15} /> Botanical QR
                </>
              ),
            },
          ]}
        />
        {progress > 0 && progress < 1 ? (
          <span
            className="morph-meter"
            style={
              { "--progress": `${progress * 360}deg` } as React.CSSProperties
            }
          />
        ) : (
          <kbd>SPACE</kbd>
        )}
      </div>
      <div className="camera-toolbar">
        <button
          title="Reset camera (R)"
          aria-label="Reset camera"
          onClick={() => {
            setRotation(0);
            update({ tilt: 0 });
          }}
        >
          <RotateCcw size={15} />
        </button>
        <button
          title="Snap to zenith"
          aria-label="Zenith camera"
          onClick={() => {
            setFlat(true);
            update({ tilt: 0 });
          }}
        >
          <Focus size={15} />
        </button>
        <span />
        <button
          title="Toggle breeze"
          aria-label="Toggle breeze"
          aria-pressed={config.wind > 0}
          onClick={() => update({ wind: config.wind ? 0 : 0.3 })}
        >
          <Wind size={15} />
        </button>
        <AudioToggle />
        <button
          title="Workspace help"
          aria-label="Workspace help"
          onClick={() => setModal("help")}
        >
          <Info size={15} />
        </button>
      </div>
      <footer className="status-bar">
        <span>
          <span className="hardware-led" /> ALL PROCESSING LOCAL
        </span>
        <span>
          {flat
            ? `${config.mosaic.toUpperCase()} / RELIEF ${config.relief.toFixed(2)}× / TILT ${config.tilt}°`
            : "DRAG TO ORBIT / CLICK TO MORPH"}
          <span className="footer-shortcuts"> R RESET · S VERIFY</span>
        </span>
        <code>VD—024</code>
      </footer>
      {notice && (
        <div className="toast" role="status">
          {notice}
        </div>
      )}
      {modal === "help" && (
        <Modal title="Workspace controls" onClose={() => setModal("")}>
          <p>
            Drag the sculpture to orbit. Click a piece, the QR mini-map, or
            press Space to morph the same instances into the raised QR mosaic.
            Hover a piece to locate its destination in the mini-map.
          </p>
          <p>
            QR Craft controls relief, surface, finder architecture and camera
            tilt. Press R to reset to zenith and S to verify. Scan verification
            decodes the actual rendered view in QR mode; results depend on
            camera angle, relief and lighting.
          </p>
          <p>
            The center ornament stays inside a dark module. No encoded modules
            are removed. 2D PNG and SVG exports retain a full four-module quiet
            zone.
          </p>
        </Modal>
      )}
      {modal === "export" && (
        <Modal title="Export Studio" onClose={() => setModal("")}>
          <div className="export-preview">
            <QrPreview qr={qr} />
            <span>
              <strong>{form.label}</strong>
              <code>
                {qr.size} × {qr.size} / ECC {config.correction}
              </code>
              <small>{new URL(qr.url).hostname}</small>
            </span>
          </div>
          <div className="export-grid">
            <button disabled={busy} onClick={() => void download("png")}>
              <ScanLine size={19} />
              <strong>2D QR / PNG</strong>
              <small>1,200 px · 4-module margin</small>
            </button>
            <button disabled={busy} onClick={() => void download("svg")}>
              <ArrowUpRight size={19} />
              <strong>2D QR / SVG</strong>
              <small>Scalable vector matrix</small>
            </button>
          </div>
          <div className="control-label">3D studio poster resolution</div>
          <Segmented
            label="Poster resolution"
            value={resolution}
            onChange={setResolution}
            options={[
              { id: "2", label: "2× / 2400 × 2800" },
              { id: "4", label: "4× / 4800 × 5600" },
            ]}
          />
          <button
            className="full-button"
            disabled={busy || (progress > 0 && progress < 1)}
            onClick={() => void download("poster")}
          >
            <ArrowDownToLine size={15} />
            {busy
              ? "Rendering…"
              : `Download ${flat ? "3D QR diorama" : "sculpture"} poster`}
          </button>
          <button className="share-button" onClick={() => void share()}>
            <Copy size={14} /> Copy exact studio configuration
          </button>
        </Modal>
      )}
    </div>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
