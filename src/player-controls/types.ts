import type { Camera, Object3D, Vector3 } from 'three';

export type PlayerAction = 'MoveForward' | 'MoveBackward' | 'MoveLeft' | 'MoveRight' | 'Run';
export type InputSource = 'keyboard' | 'joystick';

export interface PlayerInputFrame {
  moveX: number;
  moveY: number;
  run: boolean;
  active: boolean;
  source: InputSource | 'mixed' | 'none';
}
export interface InputSystemOptions {
  target?: Window;
  documentTarget?: Document;
  sensitivity?: number;
  deadZone?: number;
}
export interface JoystickOptions {
  maxRadius?: number;
  deadZone?: number;
  sensitivity?: number;
}
export interface PlayerMotionConfig {
  walkSpeed: number;
  runSpeed: number;
  acceleration: number;
  deceleration: number;
  rotationSpeed: number;
  inputSensitivity: number;
  deadZone: number;
  capsuleRadius: number;
  capsuleHeight: number;
  gravityEnabled: boolean;
}
export interface PlayerCollisionWorld {
  /** Move a vertical capsule and return its collision-resolved world position. */
  moveAndSlide(currentPosition: Vector3, displacement: Vector3, capsule: { radius: number; height: number }): Vector3;
}
export interface PlayerControllerContext {
  player: Object3D;
  camera: Camera;
  collisionWorld: PlayerCollisionWorld;
}
export interface PlayerMotionSnapshot {
  velocity: Vector3;
  desiredDirection: Vector3;
  moving: boolean;
  running: boolean;
  speed: number;
}

export const DEFAULT_PLAYER_MOTION_CONFIG: PlayerMotionConfig = {
  walkSpeed: 3.2,
  runSpeed: 5.8,
  acceleration: 14,
  deceleration: 18,
  rotationSpeed: 7.5,
  inputSensitivity: 1,
  deadZone: 0.12,
  capsuleRadius: 0.38,
  capsuleHeight: 1.7,
  gravityEnabled: false,
};
