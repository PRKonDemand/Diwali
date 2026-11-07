# Professional Third-Person Player Controls

Standalone TypeScript + Three.js module. Input collection, locomotion, collision resolution and UI joystick visuals are intentionally separate.

## Modules

- `input-system.ts`: centralized keyboard and joystick input; action names are `MoveForward`, `MoveBackward`, `MoveLeft`, `MoveRight`, `Run`.
- `motion-controller.ts`: camera-relative normalized movement, acceleration/deceleration, player yaw smoothing and collision-world delegation.
- `types.ts`: configuration and physics adapter contracts.

## Integration

```ts
import { PlayerInputSystem, ThirdPersonMotionController } from './player-controls';

const input = new PlayerInputSystem({ sensitivity: 1, deadZone: 0.12 });
const motion = new ThirdPersonMotionController(
  { player: playerRoot, camera: followCamera, collisionWorld: physicsWorld },
  input,
  { walkSpeed: 3.2, runSpeed: 5.8, acceleration: 14, deceleration: 18, rotationSpeed: 7.5 },
);

// The UI owns the joystick element and visuals; pass only its active surface.
const detachJoystick = input.attachJoystick(joystickHitArea, { maxRadius: 54 });

// In the existing render/update loop:
const locomotion = motion.update(deltaSeconds);

// Pause/resume and cleanup:
input.setPaused(true);
input.setPaused(false);
detachJoystick();
input.dispose();
motion.reset();
```

## Collision adapter contract

Implement `PlayerCollisionWorld.moveAndSlide` using the project's collision/physics layer. It must sweep a vertical capsule through the requested displacement, resolve wall and vehicle contacts, slide along surfaces, and return the corrected world position. The controller never writes an unverified position through obstacles. This keeps collision implementation replaceable and prevents coupling gameplay movement to a particular physics library.

## Behaviour notes

- Keyboard: WASD and arrow keys; Shift runs.
- Joystick: pointer capture, dead zone, clamped radial input, pointer-up/cancel handling, and `touch-action: none` on the supplied hit area.
- Input is cleared on window blur, document visibility loss and pause.
- Camera heading is sampled every frame; movement direction is camera-relative. Player yaw is independently smoothed toward movement heading.
- Movement uses seconds-based delta time and exponential velocity convergence, with a frame delta cap to avoid large resume-frame jumps.
- Diagonal input is normalized before speed is applied.

## Validation

Run `npm install`, `npm run typecheck` and `npm test` in this folder. Tests cover diagonal normalization, camera-relative direction, pause/focus reset, joystick cancellation and collision-world position delegation.
