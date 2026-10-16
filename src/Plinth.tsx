import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  type MutableRefObject,
} from "react";
import { shadeStone } from "./qrMaterial";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { hash, palettes, type Season } from "./sculptures";
import type { StudioConfig } from "./studio";
import { stoneColor, TILE_SPAN } from "./mosaic";
export function Plinth({
  season,
  url,
  size,
  morph,
  style,
}: {
  season: Season;
  url: string;
  size: number;
  morph: MutableRefObject<number>;
  style: StudioConfig["plinth"];
}) {
  const materialMorph = useMemo(() => ({ value: 0 }), []);
  const tiles = useRef<THREE.InstancedMesh>(null!),
    last = useRef(-1),
    n = size + 8;
  const frame = useMemo(
      () => new RoundedBoxGeometry(5.34, 0.29, 5.34, 2, 0.065),
      [],
    ),
    tile = useMemo(() => new RoundedBoxGeometry(1, 1, 1, 1, 0.035), []);
  const color = useMemo(() => new THREE.Color(), []),
    light = useMemo(() => new THREE.Color(stoneColor(season)), [season]);
  const plaque = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 96;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#d3c9b6";
    ctx.fillRect(0, 0, 1024, 96);
    ctx.fillStyle = "#5c5a4e";
    ctx.font = "26px monospace";
    ctx.textAlign = "center";
    ctx.fillText(
      `VD / ${hash(url).toString(16).toUpperCase().padStart(8, "0")} / ${size} × ${size}`,
      512,
      58,
    );
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [url, size]);
  useEffect(() => () => frame.dispose(), [frame]);
  useEffect(() => () => tile.dispose(), [tile]);
  useEffect(() => () => plaque.dispose(), [plaque]);
  useLayoutEffect(() => {
    const d = new THREE.Object3D(),
      cell = TILE_SPAN / n;
    for (let i = 0; i < n * n; i++) {
      d.position.set(
        ((i % n) - (n - 1) / 2) * cell,
        0.15,
        (Math.floor(i / n) - (n - 1) / 2) * cell,
      );
      d.scale.set(cell * 0.997, 0.04, cell * 0.997);
      d.updateMatrix();
      tiles.current.setMatrixAt(i, d.matrix);
      tiles.current.setColorAt(i, light);
    }
    tiles.current.instanceMatrix.needsUpdate = true;
    tiles.current.instanceColor!.needsUpdate = true;
    last.current = -1;
  }, [n, light]);
  useFrame(() => {
    const t = morph.current;
    materialMorph.value = t;
    if (Math.abs(last.current - t) < 0.003) return;
    last.current = t;
    for (let i = 0; i < n * n; i++) {
      const x = i % n,
        z = Math.floor(i / n),
        edge = x < 4 || z < 4 || x >= n - 4 || z >= n - 4;
      const base =
        edge || style === "grid"
          ? stoneColor(season)
          : season === "winter"
            ? "#e6ece6"
            : ["#d4d8c3", "#c3ccb0", "#e5e4d6"][i % 3];
      color.set(base).lerp(light, t);
      tiles.current.setColorAt(i, color);
    }
    tiles.current.instanceColor!.needsUpdate = true;
  });
  const frameColor =
    style === "slate"
      ? "#424b4b"
      : style === "terrarium"
        ? "#8b957e"
        : "#ddd9cd";
  return (
    <group>
      <mesh geometry={frame} position={[0, -0.15, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={frameColor} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.065, 0]} receiveShadow>
        <boxGeometry args={[5.13, 0.15, 5.13]} />
        <meshStandardMaterial
          color={style === "terrarium" ? "#675a40" : "#d2cbbb"}
          roughness={1}
        />
      </mesh>
      <instancedMesh
        ref={tiles}
        args={[tile, undefined, n * n]}
        receiveShadow
        frustumCulled={false}
      >
        <meshStandardMaterial
          roughness={0.94}
          color="#ffffff"
          onBeforeCompile={(shader) => shadeStone(shader, materialMorph)}
          customProgramCacheKey={() => "verdant-stone-v2"}
        />
      </instancedMesh>
      <mesh position={[0, -0.14, 2.676]}>
        <planeGeometry args={[1.7, 0.16]} />
        <meshStandardMaterial map={plaque} roughness={0.9} />
      </mesh>
      {Array.from({ length: 28 }, (_, i) => {
        const corner = i % 4,
          a = (corner * Math.PI) / 2 + Math.PI / 4,
          r = 3.49 + (i % 3) * 0.02;
        return (
          <mesh
            key={i}
            position={[
              Math.cos(a) * r + Math.sin(i * 8) * 0.025,
              0.19 + (i % 3) * 0.018,
              Math.sin(a) * r + Math.cos(i * 7) * 0.025,
            ]}
            rotation={[0, i, 0.15]}
            castShadow
          >
            <dodecahedronGeometry args={[0.035 + (i % 3) * 0.012, 0]} />
            <meshStandardMaterial
              color={palettes[season][i % 5]}
              roughness={0.9}
            />
          </mesh>
        );
      })}
    </group>
  );
}
