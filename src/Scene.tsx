import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Component,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
  type MutableRefObject,
} from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { sculpture, hash } from "./sculptures";
import { shadeMosaic } from "./qrMaterial";
import { Plinth } from "./Plinth";
import { mosaic, projectRelief, TILE_SPAN } from "./mosaic";
import type { QrData } from "./qr";
import type { StudioConfig } from "./studio";
import { advanceTransition, transitionPose } from "./transition";
export type Capture = (factor: number, cropQr?: boolean) => HTMLCanvasElement;
export type SceneProps = {
  qr: QrData;
  config: StudioConfig;
  flat: boolean;
  reduced: boolean;
  rotation: number;
  onToggle: () => void;
  onStats: (fps: number, count: number) => void;
  onMorph: (progress: number) => void;
  onHover: (index: number | null) => void;
  captureRef: MutableRefObject<Capture | null>;
};
function World(p: SceneProps) {
  const { gl, scene, camera } = useThree();
  const materialMorph = useMemo(() => ({ value: 0 }), []);
  const mesh = useRef<THREE.InstancedMesh>(null!),
    group = useRef<THREE.Group>(null!),
    dust = useRef<THREE.InstancedMesh>(null!),
    progress = useRef(0),
    morph = useRef(0),
    hover = useRef(new THREE.Vector3(100, 100, 100)),
    pointer = useRef({ x: 0, y: 0 }),
    stats = useRef({ time: 0, frames: 0 }),
    lastReport = useRef(-1);
  const count = Math.max(6500, p.qr.points.length * 10),
    cfg = p.config;
  const items = useMemo(
    () =>
      sculpture(cfg.design, cfg.season, count, p.qr.url + cfg.seed, {
        density: cfg.density,
        curvature: cfg.curvature,
      }),
    [
      cfg.design,
      cfg.season,
      cfg.seed,
      cfg.density,
      cfg.curvature,
      count,
      p.qr.url,
    ],
  );
  const targets = useMemo(
    () => mosaic(p.qr, count, cfg),
    [
      p.qr,
      count,
      cfg.seed,
      cfg.season,
      cfg.design,
      cfg.relief,
      cfg.mosaic,
      cfg.finder,
      cfg.emblem,
    ],
  );
  const sculptGeometry = useMemo(
    () =>
      cfg.geometry === "hex"
        ? new THREE.CylinderGeometry(0.5, 0.5, 1, 6)
        : cfg.geometry === "pebble"
          ? new THREE.IcosahedronGeometry(0.65, 1)
          : new RoundedBoxGeometry(
              1,
              1,
              1,
              1,
              cfg.geometry === "leaf" ? 0.24 : 0.075,
            ),
    [cfg.geometry],
  );
  const qrGeometry = useMemo(
    () =>
      new RoundedBoxGeometry(
        1,
        1,
        1,
        1,
        cfg.mosaic === "islands" ? 0.19 : 0.045,
      ),
    [cfg.mosaic],
  );
  useEffect(() => () => sculptGeometry.dispose(), [sculptGeometry]);
  useEffect(() => () => qrGeometry.dispose(), [qrGeometry]);
  const dummy = useMemo(() => new THREE.Object3D(), []),
    color = useMemo(() => new THREE.Color(), []),
    targetColor = useMemo(() => new THREE.Color(), []),
    colors = useMemo(
      () =>
        items.map((v, i) =>
          new THREE.Color(v.color).offsetHSL(
            ((hash(String(i) + cfg.seed) % 100) / 100 - 0.5) * 0.02,
            0,
            ((i % 11) / 10 - 0.5) * 0.04,
          ),
        ),
      [items, cfg.seed],
    );
  useEffect(() => {
    p.captureRef.current = (factor, cropQr = false) => {
      const ratio = gl.getPixelRatio();
      try {
        gl.setPixelRatio(Math.min(5, ratio * factor));
        gl.render(scene, camera);
        const copy = document.createElement("canvas");
        copy.width = gl.domElement.width;
        copy.height = gl.domElement.height;
        const ctx = copy.getContext("2d")!;
        ctx.fillStyle = cfg.lighting === "obsidian" ? "#171c21" : "#eeede8";
        ctx.fillRect(0, 0, copy.width, copy.height);
        ctx.drawImage(gl.domElement, 0, 0);
        if (cropQr && group.current) {
          group.current.updateWorldMatrix(true, false);
          const corners = [-2.48, 2.48].flatMap((x) =>
            [-2.48, 2.48].map((z) =>
              new THREE.Vector3(x, -2.015, z)
                .applyMatrix4(group.current.matrixWorld)
                .project(camera),
            ),
          );
          const xs = corners.map((v) => ((v.x + 1) * copy.width) / 2);
          const ys = corners.map((v) => ((1 - v.y) * copy.height) / 2);
          const left = Math.max(0, Math.floor(Math.min(...xs))),
            top = Math.max(0, Math.floor(Math.min(...ys)));
          const width = Math.min(
            copy.width - left,
            Math.ceil(Math.max(...xs) - left),
          );
          const height = Math.min(
            copy.height - top,
            Math.ceil(Math.max(...ys) - top),
          );
          const cropped = document.createElement("canvas");
          cropped.width = width;
          cropped.height = height;
          cropped
            .getContext("2d")!
            .drawImage(copy, left, top, width, height, 0, 0, width, height);
          return cropped;
        }
        return copy;
      } finally {
        gl.setPixelRatio(ratio);
        gl.render(scene, camera);
      }
    };
    return () => {
      p.captureRef.current = null;
    };
  }, [gl, scene, camera, p.captureRef, cfg.lighting]);
  useFrame(({ clock, camera, size, pointer: mouse }, delta) => {
    const t0 = advanceTransition(progress.current, p.flat, delta, p.reduced);
    progress.current = t0;
    const t = transitionPose(t0).morph;
    morph.current = t;
    materialMorph.value = t;
    const alpha = p.reduced ? 1 : 1 - Math.exp(-delta * 5);
    pointer.current.x = THREE.MathUtils.lerp(pointer.current.x, mouse.x, alpha);
    pointer.current.y = THREE.MathUtils.lerp(pointer.current.y, mouse.y, alpha);
    const tilt = THREE.MathUtils.degToRad(cfg.tilt),
      parallax =
        p.flat && cfg.tilt > 0 && !p.reduced ? pointer.current.y * 0.045 : 0;
    const elevation = THREE.MathUtils.lerp(
      0.42,
      Math.PI / 2 - tilt + parallax,
      t,
    );
    group.current.rotation.set(
      elevation,
      (-0.55 + p.rotation) * (1 - t) +
        (p.flat && cfg.tilt > 0 ? pointer.current.x * 0.045 * t : 0),
      0,
    );
    group.current.position.y = THREE.MathUtils.lerp(
      0,
      2.04 * Math.cos(elevation),
      t,
    );
    if (camera instanceof THREE.OrthographicCamera) {
      const zoom = Math.min(
        size.width / (size.width > 800 ? 11 : 6.9),
        size.height / (size.width > 800 ? 8.5 : 10),
      );
      camera.position.x = size.width > 1000 ? 1.15 : size.width > 800 ? 1.6 : 0;
      if (camera.zoom !== zoom) {
        camera.zoom = zoom;
        camera.updateProjectionMatrix();
      }
    }
    if (mesh.current.geometry !== (t > 0.8 ? qrGeometry : sculptGeometry))
      mesh.current.geometry = t > 0.8 ? qrGeometry : sculptGeometry;
    const cell = TILE_SPAN / (p.qr.size + 8);
    for (let i = 0; i < count; i++) {
      const v = items[i],
        q = targets[i],
        rad = Math.hypot(q.x, q.z) / 3.4,
        local =
          t === 1
            ? 1
            : THREE.MathUtils.smoothstep(t, rad * 0.12, 0.84 + rad * 0.12),
        rest = 1 - local;
      const breeze = p.reduced
        ? 0
        : Math.sin(
            clock.elapsedTime * (cfg.turbulence ? 2.7 : 1.25) + v.y * 1.8 + v.x,
          ) * cfg.wind;
      const distance = Math.hypot(
          hover.current.x - v.x,
          hover.current.y - v.y,
          hover.current.z - v.z,
        ),
        repel = Math.max(0, 1 - distance / 0.7) * 0.12 * rest;
      const wave = breeze * 0.035 * Math.max(0, v.y + 1) * rest;
      const module = p.qr.points[q.module];
      const relief = projectRelief(
        q,
        (module[0] - (p.qr.size - 1) / 2) * cell,
        (module[1] - (p.qr.size - 1) / 2) * cell,
        cell,
        Math.PI / 2 - tilt + parallax,
        group.current.rotation.y * t,
        breeze,
      );
      dummy.position.set(
        THREE.MathUtils.lerp(v.x + wave + repel, relief.x, local),
        THREE.MathUtils.lerp(v.y, relief.y, local),
        THREE.MathUtils.lerp(v.z, relief.z, local),
      );
      dummy.rotation.set(v.rx * (1 - local), 0, v.rz * (1 - local));
      const sculptY = v.scale * (cfg.geometry === "leaf" ? 0.3 : 0.85);
      dummy.scale.set(
        THREE.MathUtils.lerp(v.scale, q.sx, local),
        THREE.MathUtils.lerp(sculptY, q.sy, local),
        THREE.MathUtils.lerp(v.scale, relief.sz, local),
      );
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
      targetColor.set(q.color);
      color.copy(colors[i]).lerp(targetColor, local);
      mesh.current.setColorAt(i, color);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
    if (mesh.current.instanceColor)
      mesh.current.instanceColor.needsUpdate = true;
    for (let i = 0; i < 80; i++) {
      const a =
          i * 2.399 +
          clock.elapsedTime *
            (p.reduced ? 0 : cfg.particles === "fireflies" ? 0.15 : 0.025),
        r = 2.8 + (i % 5) * 0.07;
      const height =
        cfg.particles === "petals"
          ? 3 - ((i * 0.067 + clock.elapsedTime * 0.2) % 4)
          : Math.sin(i * 4 + clock.elapsedTime * 0.2) * 1.7;
      dummy.position.set(Math.cos(a) * r, height, Math.sin(a) * r);
      dummy.rotation.set(i, a, 0);
      dummy.scale.setScalar(
        cfg.particles === "off"
          ? 0
          : (1 - t) * 0.015 + (cfg.particles === "fireflies" ? 0.009 : 0),
      );
      dummy.updateMatrix();
      dust.current.setMatrixAt(i, dummy.matrix);
    }
    dust.current.instanceMatrix.needsUpdate = true;
    stats.current.time += delta;
    stats.current.frames++;
    if (stats.current.time > 1) {
      p.onStats(Math.round(stats.current.frames / stats.current.time), count);
      stats.current = { time: 0, frames: 0 };
    }
    if (
      Math.abs(lastReport.current - t0) > 0.035 ||
      (t0 === 0 && lastReport.current !== 0) ||
      (t0 === 1 && lastReport.current !== 1)
    ) {
      lastReport.current = t0;
      p.onMorph(t0);
    }
  });
  const sunset = cfg.lighting === "sunset",
    museum = cfg.lighting === "museum",
    dark = cfg.lighting === "obsidian";
  return (
    <>
      <ambientLight intensity={dark ? 0.65 : 0.9} />
      <hemisphereLight
        args={[sunset ? "#f8dbc0" : "#e3edf7", "#8c8370", 0.85]}
      />
      <directionalLight
        castShadow
        position={[-3, 7, 5]}
        intensity={sunset ? 2.7 : 2.3}
        color={sunset ? "#ffcc8e" : "#fff4df"}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
        shadow-normalBias={0.018}
        shadow-bias={-0.0001}
        shadow-radius={3}
      />
      <directionalLight
        position={[4, 3, -5]}
        intensity={museum ? 2.8 : 1.5}
        color="#f1e3c5"
      />
      <directionalLight
        position={[-5, 2, -2]}
        intensity={0.6}
        color="#c5dff3"
      />
      <group ref={group}>
        <instancedMesh
          ref={mesh}
          args={[sculptGeometry, undefined, count]}
          castShadow
          receiveShadow
          frustumCulled={false}
          onClick={(e) => {
            e.stopPropagation();
            p.onToggle();
          }}
          onPointerMove={(e) => {
            hover.current.copy(e.point);
            group.current.worldToLocal(hover.current);
            p.onHover(
              e.instanceId == null ? null : e.instanceId % p.qr.points.length,
            );
          }}
          onPointerOut={() => {
            hover.current.set(100, 100, 100);
            p.onHover(null);
          }}
        >
          <meshStandardMaterial
            onBeforeCompile={(shader) => shadeMosaic(shader, materialMorph)}
            customProgramCacheKey={() => "verdant-mosaic-v2"}
            roughness={cfg.design === "crystal" ? 0.38 : 0.86}
            metalness={cfg.design === "crystal" ? 0.12 : 0}
          />
        </instancedMesh>
        <group position={[0, -2.16, 0]}>
          <Plinth
            season={cfg.season}
            url={p.qr.url}
            size={p.qr.size}
            morph={morph}
            style={cfg.plinth}
          />
        </group>
        <instancedMesh
          ref={dust}
          args={[undefined, undefined, 80]}
          frustumCulled={false}
        >
          <octahedronGeometry />
          <meshBasicMaterial
            color={
              cfg.particles === "fireflies"
                ? "#cecc86"
                : cfg.season === "winter"
                  ? "#e8eded"
                  : "#b69b78"
            }
            toneMapped={false}
          />
        </instancedMesh>
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -2.48, 0]}
          receiveShadow
        >
          <planeGeometry args={[200, 200]} />
          <shadowMaterial opacity={dark ? 0.3 : 0.13} transparent />
        </mesh>
      </group>
    </>
  );
}
class Boundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
export function Scene(p: SceneProps & { fallback: ReactNode }) {
  return (
    <Boundary fallback={p.fallback}>
      <Canvas
        shadows={{ type: THREE.PCFSoftShadowMap }}
        orthographic
        camera={{ position: [0, 0, 12], zoom: 75, near: 0.1, far: 150 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          preserveDrawingBuffer: true,
          toneMapping: THREE.ACESFilmicToneMapping,
        }}
        resize={{ scroll: false }}
      >
        <World {...p} />
      </Canvas>
    </Boundary>
  );
}
