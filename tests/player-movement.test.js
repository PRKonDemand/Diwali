import test from "node:test";
import assert from "node:assert/strict";
import { createPlayerMovement } from "../src/player/createPlayerMovement.js";

const THREE = {
  MathUtils: {
    clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
  }
};

function setup({ intent = { x: 0, y: 0 }, yaw = 0, blocked = () => false, speed = 2.8 } = {}) {
  const player = {
    root: {
      position: { x: 0, y: 0, z: 0 },
      rotation: { y: 0 }
    },
    walkUpdates: [],
    updateWalk(time, moving) { this.walkUpdates.push({ time, moving }); }
  };
  const input = {
    getMovement: () => intent,
    getCamera: () => ({ yaw })
  };
  const city = { isBlocked: blocked };
  const movement = createPlayerMovement({ THREE, player, city, input, speed });
  return { player, movement };
}

test("changing character facing does not rotate the movement basis", () => {
  const { player, movement } = setup({ intent: { x: 1, y: 0 } });
  movement.update(1 / 30, 1);
  assert.ok(player.root.position.x > 0);
  assert.ok(Math.abs(player.root.position.z) < 1e-9);
  const firstX = player.root.position.x;

  // The character now faces right, but forward input remains camera-forward.
  const input = { getMovement: () => ({ x: 0, y: 1 }), getCamera: () => ({ yaw: 0 }) };
  const second = createPlayerMovement({ THREE, player, city: { isBlocked: () => false }, input });
  second.update(1 / 30, 2);
  assert.ok(Math.abs(player.root.position.x - firstX) < 1e-9);
  assert.ok(player.root.position.z > 0);
});

test("movement speed is capped and independent of frame spikes", () => {
  const { player, movement } = setup({ intent: { x: 0, y: 1 }, speed: 2.8 });
  movement.update(0.5, 1);
  assert.ok(Math.abs(player.root.position.z - (2.8 / 30)) < 1e-9);
});

test("diagonal movement is normalized to the same total speed", () => {
  const { player, movement } = setup({ intent: { x: 1, y: 1 } });
  movement.update(1 / 30, 1);
  const distance = Math.hypot(player.root.position.x, player.root.position.z);
  assert.ok(Math.abs(distance - (2.8 / 30)) < 1e-9);
});

test("collision on one axis still permits movement on the other axis", () => {
  const { player, movement } = setup({
    intent: { x: 1, y: 1 },
    blocked: (x, z) => x > 0
  });
  movement.update(1 / 30, 1);
  assert.equal(player.root.position.x, 0);
  assert.ok(player.root.position.z > 0);
});

test("idle input does not move the player and stops the walk animation", () => {
  const { player, movement } = setup();
  movement.update(1 / 30, 1);
  assert.deepEqual(player.root.position, { x: 0, y: 0, z: 0 });
  assert.equal(player.walkUpdates.at(-1).moving, false);
});
