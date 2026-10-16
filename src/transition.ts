export const TRANSITION_SECONDS = 1.8;
export const QR_GROUND_Y = -2.02;
const clamp = (x: number, low: number, high: number) =>
  Math.max(low, Math.min(high, x));
const smooth = (x: number, low: number, high: number) => {
  const t = clamp((x - low) / (high - low), 0, 1);
  return t * t * (3 - 2 * t);
};
export function advanceTransition(
  progress: number,
  flat: boolean,
  delta: number,
  reduced: boolean,
) {
  const target = flat ? 1 : 0;
  if (reduced) return target;
  const step = clamp(delta, 0, 0.05) / TRANSITION_SECONDS;
  return clamp(target, progress - step, progress + step);
}
export function transitionPose(progress: number) {
  const camera = smooth(progress, 0, 0.85);
  const elevation = 0.2 + (Math.PI / 2 - 0.2) * camera;
  return {
    morph: smooth(progress, 0.2, 1),
    elevation,
    centerY: -QR_GROUND_Y * camera * Math.cos(elevation),
    azimuthWeight: 1 - camera,
  };
}
