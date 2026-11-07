import { describe, expect, it } from 'vitest';
import { Camera, Object3D } from 'three';
import { PlayerInputSystem } from '../input-system';
import { ThirdPersonMotionController } from '../motion-controller';
import type { PlayerCollisionWorld } from '../types';

class FakeTarget extends EventTarget { hidden = false; }
class FakeElement extends EventTarget {
  style = { touchAction: '', overscrollBehavior: '' };
  rect = { left: 0, top: 0, width: 120, height: 120 };
  getBoundingClientRect() { return this.rect as DOMRect; }
  setPointerCapture(_id: number) {}
  releasePointerCapture(_id: number) {}
}
function keyboard(type: 'keydown' | 'keyup', code: string): KeyboardEvent {
  const event = new Event(type, { cancelable: true }) as KeyboardEvent;
  Object.defineProperty(event, 'code', { value: code });
  return event;
}
function pointer(type: string, values: Record<string, number>): PointerEvent {
  const event = new Event(type, { cancelable: true }) as PointerEvent;
  for (const [key, value] of Object.entries(values)) Object.defineProperty(event, key, { value });
  return event;
}
const collision: PlayerCollisionWorld = {
  moveAndSlide: (position, displacement) => position.add(displacement),
};

describe('PlayerInputSystem', () => {
  it('normalizes diagonal keyboard input and releases keys', () => {
    const target = new FakeTarget();
    const input = new PlayerInputSystem({ target: target as unknown as Window, documentTarget: undefined });
    target.dispatchEvent(keyboard('keydown', 'KeyW')); target.dispatchEvent(keyboard('keydown', 'KeyD'));
    expect(Math.hypot(input.getFrame().moveX, input.getFrame().moveY)).toBeCloseTo(1);
    target.dispatchEvent(keyboard('keyup', 'KeyW'));
    expect(input.getFrame().moveY).toBe(0);
    input.dispose();
  });
  it('clears held input on pause and focus loss', () => {
    const target = new FakeTarget();
    const input = new PlayerInputSystem({ target: target as unknown as Window, documentTarget: undefined });
    target.dispatchEvent(keyboard('keydown', 'KeyW')); input.setPaused(true);
    expect(input.getFrame().active).toBe(false);
    input.setPaused(false); target.dispatchEvent(keyboard('keydown', 'KeyW'));
    target.dispatchEvent(new Event('blur'));
    expect(input.getFrame().active).toBe(false);
    input.dispose();
  });
  it('supports UI-bound run action without coupling it to movement', () => {
    const target = new FakeTarget();
    const input = new PlayerInputSystem({ target: target as unknown as Window, documentTarget: undefined });
    input.setAction('Run', true); expect(input.getFrame().run).toBe(true);
    input.setAction('Run', false); expect(input.getFrame().run).toBe(false);
    input.dispose();
  });
  it('normalizes joystick diagonals, prevents browser gestures and releases on cancellation', () => {
    const target = new FakeTarget(), element = new FakeElement();
    const input = new PlayerInputSystem({ target: target as unknown as Window, documentTarget: undefined });
    const detach = input.attachJoystick(element as unknown as HTMLElement);
    expect(element.style.touchAction).toBe('none');
    element.dispatchEvent(pointer('pointerdown', { pointerId: 3, clientX: 114, clientY: 6, button: 0 }));
    expect(Math.hypot(input.getFrame().moveX, input.getFrame().moveY)).toBeCloseTo(1);
    element.dispatchEvent(pointer('pointercancel', { pointerId: 3 }));
    expect(input.getFrame().active).toBe(false);
    detach(); expect(element.style.touchAction).toBe('');
    input.dispose();
  });
  it('removes old joystick handlers when a new surface is attached', () => {
    const target = new FakeTarget(), first = new FakeElement(), second = new FakeElement();
    const input = new PlayerInputSystem({ target: target as unknown as Window, documentTarget: undefined });
    input.attachJoystick(first as unknown as HTMLElement);
    input.attachJoystick(second as unknown as HTMLElement);
    first.dispatchEvent(pointer('pointerdown', { pointerId: 1, clientX: 114, clientY: 60, button: 0 }));
    expect(input.getFrame().active).toBe(false);
    input.dispose();
  });
});

describe('ThirdPersonMotionController', () => {
  it('moves relative to camera heading and delegates collision resolution', () => {
    const target = new FakeTarget(), input = new PlayerInputSystem({ target: target as unknown as Window, documentTarget: undefined });
    target.dispatchEvent(keyboard('keydown', 'KeyW'));
    const player = new Object3D(), camera = new Camera();
    camera.rotation.y = -Math.PI / 2;
    const controller = new ThirdPersonMotionController({ player, camera, collisionWorld: collision }, input);
    controller.update(1 / 60);
    expect(player.position.x).toBeGreaterThan(0);
    input.dispose();
  });
  it('keeps diagonal speed at or below walking speed', () => {
    const target = new FakeTarget(), input = new PlayerInputSystem({ target: target as unknown as Window, documentTarget: undefined });
    target.dispatchEvent(keyboard('keydown', 'KeyW')); target.dispatchEvent(keyboard('keydown', 'KeyD'));
    const controller = new ThirdPersonMotionController({ player: new Object3D(), camera: new Camera(), collisionWorld: collision }, input);
    expect(controller.update(1 / 60).speed).toBeLessThanOrEqual(3.2);
    input.dispose();
  });
});
