import { useState } from "react";
import {
  Blocks,
  ChevronDown,
  Flower2,
  Gem,
  Layers3,
  Leaf,
  Mountain,
  Orbit,
  ScanLine,
  SlidersHorizontal,
  Sparkles,
  Square,
  TreeDeciduous,
  Wind,
} from "lucide-react";
import { forms, seasons, type StudioConfig } from "../studio";
import { palettes } from "../sculptures";
import { FormThumbnail } from "./FormThumbnail";
import { Picker, Scrub, Segmented, Toggle } from "./ui/Controls";
export function Inspector({
  config: c,
  onChange,
  flat,
  onFlat,
}: {
  config: StudioConfig;
  onChange: (patch: Partial<StudioConfig>) => void;
  flat: boolean;
  onFlat: () => void;
}) {
  const [tab, setTab] = useState("sculpt"),
    [expanded, setExpanded] = useState(false);
  return (
    <aside className={`inspector ${expanded ? "expanded" : ""}`}>
      <button
        className="drawer-handle"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <span />
        <SlidersHorizontal size={15} /> Inspector <ChevronDown size={14} />
      </button>
      <div className="inspector-title">
        <span>
          <SlidersHorizontal size={14} /> INSPECTOR
        </span>
        <span className="hardware-led" />
      </div>
      <div
        className="inspector-tabs"
        role="tablist"
        aria-label="Inspector sections"
      >
        {[
          { id: "sculpt", label: "Sculpt", icon: Orbit },
          { id: "qr", label: "QR Craft", icon: ScanLine },
          { id: "atmosphere", label: "Atmosphere", icon: Wind },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            id={`tab-${id}`}
            aria-controls="inspector-panel"
            onClick={() => setTab(id)}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>
      <div
        className="inspector-scroll"
        id="inspector-panel"
        role="tabpanel"
        aria-labelledby={`tab-${tab}`}
      >
        {tab === "sculpt" ? (
          <>
            <section>
              <div className="section-label">
                ARCHETYPE <span>6.5K+ INSTANCES</span>
              </div>
              <div className="form-grid">
                {forms.map((f) => (
                  <button
                    key={f.id}
                    aria-pressed={c.design === f.id}
                    className={c.design === f.id ? "selected" : ""}
                    onClick={() => onChange({ design: f.id })}
                  >
                    <FormThumbnail form={f.id} />
                    <strong>{f.label}</strong>
                    <small>{f.sub}</small>
                    <span className="form-radio" />
                  </button>
                ))}
              </div>
            </section>
            <section>
              <div className="section-label">SEASONAL PALETTE</div>
              <div className="season-grid">
                {seasons.map((s) => (
                  <button
                    key={s}
                    className={c.season === s ? "selected" : ""}
                    aria-pressed={c.season === s}
                    onClick={() => onChange({ season: s })}
                  >
                    <span className="swatches">
                      {[
                        palettes[s][4],
                        palettes[s][0],
                        palettes[s][2],
                        s === "winter" ? "#e7eeee" : "#ded8c8",
                      ].map((color, i) => (
                        <i key={i} style={{ background: color }} />
                      ))}
                    </span>
                    <span>{s}</span>
                  </button>
                ))}
              </div>
            </section>
            <section>
              <div className="section-label">
                BOTANICAL DNA <span>LIVE</span>
              </div>
              <Scrub
                label="Canopy / petal density"
                value={c.density}
                min={0.2}
                onChange={(density) => onChange({ density })}
                ends={["Sparse", "Lush"]}
              />
              <Scrub
                label="Organic curvature"
                value={c.curvature}
                onChange={(curvature) => onChange({ curvature })}
              />
              <div className="control-label">Voxel geometry</div>
              <Segmented
                label="Voxel geometry"
                value={c.geometry}
                onChange={(geometry) => onChange({ geometry })}
                options={[
                  {
                    id: "chamfer",
                    label: (
                      <>
                        <Blocks size={17} />
                        <small>Chamfer</small>
                      </>
                    ),
                  },
                  {
                    id: "pebble",
                    label: (
                      <>
                        <Orbit size={17} />
                        <small>Pebble</small>
                      </>
                    ),
                  },
                  {
                    id: "leaf",
                    label: (
                      <>
                        <Leaf size={17} />
                        <small>Leaf</small>
                      </>
                    ),
                  },
                  {
                    id: "hex",
                    label: (
                      <>
                        <Gem size={17} />
                        <small>Hex</small>
                      </>
                    ),
                  },
                ]}
              />
            </section>
          </>
        ) : tab === "qr" ? (
          <>
            <section>
              <div className="section-label">
                QR SURFACE <span>PHYSICAL GEOMETRY</span>
              </div>
              <Picker
                label="QR 3D style"
                value={c.mosaic}
                onChange={(mosaic) => onChange({ mosaic })}
                options={[
                  {
                    id: "botanical",
                    label: "Botanical Mosaic",
                    description: "Layered bark, foliage & seed caps",
                    icon: <Flower2 size={20} />,
                  },
                  {
                    id: "relief",
                    label: "Architectural Bas-Relief",
                    description: "Bevelled towers / stepped skyline",
                    icon: <Layers3 size={20} />,
                  },
                  {
                    id: "islands",
                    label: "Connected Islands",
                    description: "Continuous rounded hedges",
                    icon: <Mountain size={20} />,
                  },
                ]}
              />
              {!flat && (
                <button className="inline-action" onClick={onFlat}>
                  <ScanLine size={13} /> Inspect 3D QR surface
                </button>
              )}
            </section>
            <section>
              <div className="section-label">ELEVATION & CAMERA</div>
              <Scrub
                label="Relief height"
                value={c.relief}
                min={0.2}
                max={2.5}
                step={0.05}
                format={(v) => `${v.toFixed(2)}×`}
                onChange={(relief) => onChange({ relief })}
                ends={["Low mosaic", "Deep relief"]}
              />
              <Scrub
                label="Camera tilt from zenith"
                value={c.tilt}
                min={0}
                max={25}
                step={1}
                format={(v) => `${v}°`}
                onChange={(tilt) => onChange({ tilt })}
              />
            </section>
            <section>
              <div className="section-label">FINDER ARCHITECTURE</div>
              <Segmented
                label="Finder architecture"
                value={c.finder}
                onChange={(finder) => onChange({ finder })}
                options={[
                  {
                    id: "blossom",
                    label: (
                      <>
                        <Flower2 size={16} />
                        <small>Blossom</small>
                      </>
                    ),
                  },
                  {
                    id: "timber",
                    label: (
                      <>
                        <TreeDeciduous size={16} />
                        <small>Timber</small>
                      </>
                    ),
                  },
                  {
                    id: "crystal",
                    label: (
                      <>
                        <Gem size={16} />
                        <small>Crystal</small>
                      </>
                    ),
                  },
                ]}
              />
              <Toggle
                label="Botanical center core"
                description="Contained within a dark cell; no data removed"
                checked={c.emblem}
                onChange={(emblem) => onChange({ emblem })}
              />
              <div className="control-label">Error correction</div>
              <Segmented
                label="Error correction"
                value={c.correction}
                onChange={(correction) => onChange({ correction })}
                options={[
                  {
                    id: "L",
                    label: (
                      <>
                        <b>L</b>
                        <small>7%</small>
                      </>
                    ),
                  },
                  {
                    id: "M",
                    label: (
                      <>
                        <b>M</b>
                        <small>15%</small>
                      </>
                    ),
                  },
                  {
                    id: "Q",
                    label: (
                      <>
                        <b>Q</b>
                        <small>25%</small>
                      </>
                    ),
                  },
                  {
                    id: "H",
                    label: (
                      <>
                        <b>H</b>
                        <small>30%</small>
                      </>
                    ),
                  },
                ]}
              />
            </section>
          </>
        ) : (
          <>
            <section>
              <div className="section-label">AIR & MOTION</div>
              <Scrub
                label="Wind breeze"
                value={c.wind}
                onChange={(wind) => onChange({ wind })}
                ends={["Still", "Breezy"]}
              />
              <Toggle
                label="Turbulence"
                checked={c.turbulence}
                onChange={(turbulence) => onChange({ turbulence })}
              />
            </section>
            <section>
              <div className="section-label">DIORAMA BASE</div>
              <Picker
                label="Plinth style"
                value={c.plinth}
                onChange={(plinth) => onChange({ plinth })}
                options={[
                  {
                    id: "limestone",
                    label: "Limestone Museum",
                    icon: <Square size={18} />,
                  },
                  {
                    id: "terrarium",
                    label: "Terrarium Island",
                    icon: <Leaf size={18} />,
                  },
                  {
                    id: "slate",
                    label: "Dark Slate Pedestal",
                    icon: <Layers3 size={18} />,
                  },
                  {
                    id: "grid",
                    label: "Minimal Grid",
                    icon: <Blocks size={18} />,
                  },
                ]}
              />
            </section>
            <section>
              <div className="section-label">AMBIENT PARTICLES</div>
              <Picker
                label="Ambient particles"
                value={c.particles}
                onChange={(particles) => onChange({ particles })}
                options={[
                  {
                    id: "pollen",
                    label: "Pollen / Spores",
                    icon: <Sparkles size={17} />,
                  },
                  {
                    id: "petals",
                    label: "Falling Petals / Leaves",
                    icon: <Leaf size={17} />,
                  },
                  {
                    id: "fireflies",
                    label: "Fireflies",
                    icon: <Sparkles size={17} />,
                  },
                  { id: "off", label: "Off", icon: <Square size={17} /> },
                ]}
              />
            </section>
          </>
        )}
      </div>
      <div className="inspector-foot">
        <span className="hardware-led" /> LOCAL GENERATION <span>WEBGL 2</span>
      </div>
    </aside>
  );
}
