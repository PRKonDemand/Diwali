import { Vector3 } from 'three';
import type { PlayerControllerContext, PlayerMotionConfig, PlayerMotionSnapshot } from './types';
import { DEFAULT_PLAYER_MOTION_CONFIG } from './types';
import type { PlayerInputSystem } from './input-system';

const UP = new Vector3(0, 1, 0);
const EPSILON = 1e-5;

/** Camera-relative movement and player locomotion; camera orbit remains independent. */
export class ThirdPersonMotionController {
  readonly velocity = new Vector3();
  readonly desiredDirection = new Vector3();
  private readonly config: PlayerMotionConfig;
  private readonly forward = new Vector3();
  private readonly right = new Vector3();
  private readonly desired = new Vector3();
  private readonly displacement = new Vector3();
  private readonly targetVelocity = new Vector3();
  private readonly cameraDirection = new Vector3();
  private running = false;

  constructor(
    private readonly context: PlayerControllerContext,
    private readonly input: PlayerInputSystem,
    config: Partial<PlayerMotionConfig> = {},
  ) {
    this.config = { ...DEFAULT_PLAYER_MOTION_CONFIG, ...config };
  }

  update(deltaSeconds: number): PlayerMotionSnapshot {
    const dt = Math.min(.05, Math.max(0, deltaSeconds));
    if (dt <= 0) return this.snapshot();
    const frame = this.input.getFrame();

    this.context.camera.getWorldDirection(this.cameraDirection);
    this.forward.set(this.cameraDirection.x, 0, this.cameraDirection.z);
    if (this.forward.lengthSq() < EPSILON) this.forward.set(0, 0, -1);
    this.forward.normalize();
    this.right.crossVectors(this.forward, UP).normalize();

    this.desired.copy(this.forward).multiplyScalar(frame.moveY)
      .addScaledVector(this.right, frame.moveX);
    if (this.desired.lengthSq() > 1) this.desired.normalize();
    if (this.desired.lengthSq() < this.config.deadZone * this.config.deadZone) this.desired.set(0, 0, 0);
    this.desired.multiplyScalar(this.config.inputSensitivity);
    if (this.desired.lengthSq() > 1) this.desired.normalize();
    this.desiredDirection.copy(this.desired);

    this.running = frame.run && this.desired.lengthSq() > EPSILON;
    const targetSpeed = this.running ? this.config.runSpeed : this.config.walkSpeed;
    this.targetVelocity.copy(this.desired).multiplyScalar(targetSpeed);
    const accelerating = this.targetVelocity.lengthSq() > EPSILON;
    const rate = accelerating ? this.config.acceleration : this.config.deceleration;
    this.velocity.lerp(this.targetVelocity, 1 - Math.exp(-rate * dt));

    if (accelerating && this.velocity.lengthSq() > EPSILON) {
      const targetYaw = Math.atan2(this.velocity.x, this.velocity.z);
      const currentYaw = this.context.player.rotation.y;
      const difference = Math.atan2(Math.sin(targetYaw - currentYaw), Math.cos(targetYaw - currentYaw));
      this.context.player.rotation.y += Math.sign(difference) * Math.min(Math.abs(difference), this.config.rotationSpeed * dt);
    }

    this.displacement.copy(this.velocity).multiplyScalar(dt);
    if (this.displacement.lengthSq() > EPSILON) {
      const resolved = this.context.collisionWorld.moveAndSlide(
        this.context.player.position.clone(), this.displacement,
        { radius: this.config.capsuleRadius, height: this.config.capsuleHeight },
      );
      this.context.player.position.copy(resolved);
    }
    return this.snapshot();
  }

  setConfig(config: Partial<PlayerMotionConfig>): void { Object.assign(this.config, config); }
  getConfig(): Readonly<PlayerMotionConfig> { return this.config; }
  snapshot(): PlayerMotionSnapshot {
    return {
      velocity: this.velocity.clone(), desiredDirection: this.desiredDirection.clone(),
      moving: this.velocity.lengthSq() > .0025, running: this.running, speed: this.velocity.length(),
    };
  }
  reset(): void { this.velocity.set(0, 0, 0); this.desiredDirection.set(0, 0, 0); this.running = false; }
}
