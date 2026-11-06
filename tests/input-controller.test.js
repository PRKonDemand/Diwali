import test from "node:test";
import assert from "node:assert/strict";
import { createInputController } from "../src/controls/createInputController.js";

class MockElement {
  constructor(direction) {
    this.dataset = direction ? { direction } : {};
    this.listeners = new Map();
    this.attributes = {};
    this.classes = new Set();
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
}

function setup() {
  const mockWindow = new MockElement();
  globalThis.window = mockWindow;
  const canvas = new MockElement();
  const cameraButton = new MockElement();
  const buttons = ["up", "down", "left", "right"].map((direction) => new MockElement(direction));
  const controller = createInputController({ canvas, directionButtons: buttons, cameraButton });
  return { controller, canvas, cameraButton, buttons, mockWindow };
}

test("direction button moves while held and stops on release", () => {
  const { controller, buttons } = setup();
  buttons[0].dispatch("pointerdown", { pointerId: 1 });
  assert.deepEqual(controller.getMovement(), { x: 0, y: 1 });
  assert.equal(buttons[0].attributes["aria-pressed"], "true");
  buttons[0].dispatch("pointerup", { pointerId: 1 });
  assert.deepEqual(controller.getMovement(), { x: 0, y: 0 });
  assert.equal(buttons[0].attributes["aria-pressed"], "false");
});

test("pointer cancellation always releases movement", () => {
  const { controller, buttons } = setup();
  buttons[3].dispatch("pointerdown", { pointerId: 2 });
  buttons[3].dispatch("pointercancel", { pointerId: 2 });
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
  canvas.dispatch("pointerdown", { pointerId: 3, pointerType: "touch", clientX: 10, button: 0 });
  canvas.dispatch("pointermove", { pointerId: 3, clientX: 60 });
  assert.ok(Math.abs(controller.getCamera().yaw + 0.2) < 1e-9);
  canvas.dispatch("pointerup", { pointerId: 3 });
});

test("reset clears held buttons and keyboard input", () => {
  const { controller, buttons, mockWindow } = setup();
  buttons[1].dispatch("pointerdown", { pointerId: 4 });
  mockWindow.dispatch("keydown", { key: "a" });
  controller.reset();
  assert.deepEqual(controller.getMovement(), { x: 0, y: 0 });
  assert.equal(buttons[1].attributes["aria-pressed"], "false");
});
