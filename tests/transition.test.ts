import { test } from "node:test";
import assert from "node:assert/strict";
import {
  advanceTransition,
  transitionPose,
  QR_GROUND_Y,
} from "../src/transition";
test("starts at tree viewpoint and finishes exactly overhead with correctly oriented QR rows", () => {
  const start = transitionPose(0),
    end = transitionPose(1);
  assert.equal(start.elevation, 0.2);
  assert.equal(start.morph, 0);
  assert.equal(end.elevation, Math.PI / 2);
  assert.equal(end.morph, 1);
  assert.equal(end.azimuthWeight, 0);
  for (const qrY of [-2, 0, 2]) {
    const projectedY =
      QR_GROUND_Y * Math.cos(end.elevation) -
      -qrY * Math.sin(end.elevation) +
      end.centerY;
    assert.ok(Math.abs(projectedY - qrY) < 1e-10);
  }
});
test("camera begins rising before particles flatten and transition can reverse midway", () => {
  assert.equal(transitionPose(0.15).morph, 0);
  assert.ok(transitionPose(0.15).elevation > 0.2);
  let p = 0;
  for (let i = 0; i < 60; i++) p = advanceTransition(p, true, 1 / 60, false);
  assert.ok(p > 0 && p < 1);
  const before = p;
  p = advanceTransition(p, false, 1 / 60, false);
  assert.ok(p < before);
  for (let i = 0; i < 120; i++) p = advanceTransition(p, false, 1 / 60, false);
  assert.equal(p, 0);
});
test("reduced motion immediately selects the requested endpoint", () => {
  assert.equal(advanceTransition(0.4, true, 0, true), 1);
  assert.equal(advanceTransition(0.6, false, 0, true), 0);
});
