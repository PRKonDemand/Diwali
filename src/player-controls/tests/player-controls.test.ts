import { describe, expect, it } from 'vitest';
import { Camera, Object3D, Vector3 } from 'three';
import { PlayerInputSystem } from '../input-system';
import { ThirdPersonMotionController } from '../motion-controller';
import type { PlayerCollisionWorld } from '../types';

class FakeTarget extends EventTarget {
  hidden = false;
}
class FakeElement extends EventTarget {
  style = { touchAction: '', overscrollBehavior: '' };
  rect = { left: 0, top: 0, width: 120, height: 120 };
  getBoundingClientRect() { return this.rect as DOMRect; }
  setPointerCapture(_id: number) {}
  releasePointerCapture(_id: number) {}
}
function keyboard(code: string): KeyboardEvent {
  return new KeyboardEvent('keydown', { code, bubbles: true, cancelable: true });
}
const collision: PlayerCollisionWorld = {
  moveAndSlide: (position, displacement) => position.add(displacement),
};

describe('PlayerInputSystem', () => {
  it('normalizes diagonal keyboard input', () => {
    const target = new FakeTarget();
    const input = new PlayerInputSystem({ target: target as unknown as Window, documentTarget: undefined });
    target.dispatchEvent(keyboard('KeyW')); target.dispatchEvent(keyboard('KeyD'));
    const frame = input.getFrame();
    expect(Math.hypot(frame.moveX, frame.moveY)).toBeCloseTo(1);
    input.dispose();
  });
  it('clears held input when paused', () => {
    const target = new FakeTarget();
    const input = new PlayerInputSystem({ target: target as unknown as Window, documentTarget: undefined });
    target.dispatchEvent(keyboard('KeyW')); input.setPaused(true);
    expect(input.getFrame().active).toBe(false);
    input.setPaused(false); expect(input.getFrame().active).toBe(false);
    input.dispose();
  });
  it('resets input on focus loss', () => {
    const target = new FakeTarget();
    const input = new PlayerInputSystem({ target: target as unknown as Window, documentTarget: undefined });
    target.dispatchEvent(keyboard('KeyW')); target.dispatchEvent(new Event('blur'));
    expect(input.getFrame().active).toBe(false);
    input.dispose();
  });
  it('normalizes joystick diagonals and releases on pointer cancellation', () => {
    const target = new FakeTarget();
    const input = new PlayerInputSystem({ target: target as unknown as Window, documentTarget: undefined });
    const element = new FakeElement();
    input.attachJoystick(element as unknown as HTMLElement);
    const down = new Event('pointerdown', { cancelable: true }) as Event & { pointerId: number; clientX: number; clientY: number; button: number; preventDefault: () => void };
    Object.assign(down, { pointerId: 3, clientX: 60 + 54, clientY: 60 - 54, button: 0 });
    element.dispatchEvent(down);
    expect(Math.hypot(input.getFrame().moveX, input.getFrame().moveY)).toBeCloseTo(1);
    const cancel = new Event('pointercancel', { cancelable: true }) as Event & { pointerId: number; preventDefault: () => void };
    Object.assign(cancel, { pointerId: 3 }); element.dispatchEvent(cancel);
    expect(input.getFrame().active).toBe(false);
    input.dispose();
  });
});

describe('ThirdPersonMotionController', () => {
  it('moves forward relative to the camera and uses collision-resolved position', () => {
    const target = new FakeTarget();
    const input = new PlayerInputSystem({ target: target as unknown as Window, documentTarget: undefined });
    target.dispatchEvent(keyboard('KeyW'));
    const player = new Object3D(), camera = new Camera();
    camera.rotation.y = Math.PI / 2;
    const controller = new ThirdPersonMotionController({ player, camera, collisionWorld: collision }, input);
    controller.update(1 / 60);
    expect(player.position.x).toBeGreaterThan(0);
    input.dispose();
  });
  it('does not move faster diagonally than straight ahead', () => {
    const target = new FakeTarget();
    const input = new PlayerInputSystem({ target: target as unknown as Window, documentTarget: undefined });
    const player = new Object3D(), camera = new Camera();
    target.dispatchEvent(keyboard('KeyW')); target.dispatchEvent(keyboard('KeyD'));
    const controller = new ThirdPersonMotionController({ player, camera, collisionWorld: collision }, input);
    const state = controller.update(1 / 60);
    expect(state.speed).toBeLessThanOrEqual(3.2);
    input.dispose();
  });
});
