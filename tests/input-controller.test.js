import test from "node:test";
import assert from "node:assert/strict";
import { createInputController } from "../src/controls/createInputController.js";

class MockElement {
  constructor() {
    this.listeners = new Map();
    this.attributes = {};
    this.classes = new Set();
    this.style = {};
    this.classList = {
      add: (name) => this.classes.add(name),
      remove: (name) => this.classes.delete(name)
    };
  }
  addEventListener(type, callback) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(callback);
  }
  dispatch(type, properties = {}) {
    const event = { type, target: this, preventDefault() {}, ...properties };
    for (const callback of this.listeners.get(type) ?? []) callback(event);
    return event;
  }
  setPointerCapture(pointerId) { this.capturedPointer = pointerId; }
  setAttribute(name, value) { this.attributes[name] = value; }
  getBoundingClientRect() { return { left: 0, top: 0, width: 136, height: 136 }; }
}

function setup() {
  const mockWindow = new MockElement();
  globalThis.window = mockWindow;
  const canvas = new MockElement();
  const joystickBase = new MockElement();
  const joystickKnob = new MockElement();
  const cameraButton = new MockElement();
  const controller = createInputController({ canvas, joystickBase, joystickKnob, cameraButton });
  return { controller, canvas, cameraButton, joystickBase, joystickKnob, mockWindow };
}

test("joystick gives directional input and returns to neutral on release", () => {
  const { controller, joystickBase } = setup();
  joystickBase.dispatch("pointerdown", { pointerId: 1, clientX: 107, clientY: 68 });
  assert.ok(controller.getMovement().x > 0.99);
  assert.ok(Math.abs(controller.getMovement().y) < 1e-9);
  assert.equal(joystickBase.classes.has("is-active"), true);
  joystickBase.dispatch("pointerup", { pointerId: 1 });
  assert.deepEqual(controller.getMovement(), { x: 0, y: 0 });
  assert.equal(joystickBase.classes.has("is-active"), false);
});

test("joystick supports partial movement intensity", () => {
  const { controller, joystickBase } = setup();
  joystickBase.dispatch("pointerdown", { pointerId: 2, clientX: 88, clientY: 68 });
  const movement = controller.getMovement();
  assert.ok(movement.x > 0 && movement.x < 1);
  assert.equal(movement.y, 0);
});

test("pointer cancellation releases joystick movement", () => {
  const { controller, joystickBase } = setup();
  joystickBase.dispatch("pointerdown", { pointerId: 3, clientX: 107, clientY: 68 });
  joystickBase.dispatch("pointercancel", { pointerId: 3 });
  assert.deepEqual(controller.getMovement(), { x: 0, y: 0 });
});

test("keyboard movement and diagonal normalization work", () => {
  const { controller, mockWindow } = setup();
  mockWindow.dispatch("keydown", { key: "w" });
  mockWindow.dispatch("keydown", { key: "d" });
  const movement = controller.getMovement();
  assert.ok(Math.abs(movement.x - Math.SQRT1_2) < 1e-9);
  assert.ok(Math.abs(movement.y - Math.SQRT1_2) < 1e-9);
  mockWindow.dispatch("keyup", { key: "w" });
  mockWindow.dispatch("keyup", { key: "d" });
  assert.deepEqual(controller.getMovement(), { x: 0, y: 0 });
});

test("camera distance button and drag rotation work", () => {
  const { controller, cameraButton, canvas } = setup();
  cameraButton.dispatch("click");
  assert.equal(controller.getCamera().distance, 11.5);
  canvas.dispatch("pointerdown", { pointerId: 4, pointerType: "touch", clientX: 10, button: 0 });
  canvas.dispatch("pointermove", { pointerId: 4, clientX: 60 });
  assert.ok(Math.abs(controller.getCamera().yaw + 0.2) < 1e-9);
  canvas.dispatch("pointerup", { pointerId: 4 });
});

test("reset clears joystick and keyboard input", () => {
  const { controller, joystickBase, mockWindow } = setup();
  joystickBase.dispatch("pointerdown", { pointerId: 5, clientX: 107, clientY: 68 });
  mockWindow.dispatch("keydown", { key: "a" });
  controller.reset();
  assert.deepEqual(controller.getMovement(), { x: 0, y: 0 });
  assert.equal(joystickBase.classes.has("is-active"), false);
});
