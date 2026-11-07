import type { InputSystemOptions, JoystickOptions, PlayerAction, PlayerInputFrame } from './types';

const ACTION_KEYS: Record<PlayerAction, string[]> = {
  MoveForward: ['KeyW', 'ArrowUp'],
  MoveBackward: ['KeyS', 'ArrowDown'],
  MoveLeft: ['KeyA', 'ArrowLeft'],
  MoveRight: ['KeyD', 'ArrowRight'],
  Run: ['ShiftLeft', 'ShiftRight'],
};

/** Centralized input collection. It knows actions, not player movement or UI layout. */
export class PlayerInputSystem {
  private readonly target: Window;
  private readonly documentTarget?: Document;
  private readonly options: Required<Pick<InputSystemOptions, 'sensitivity' | 'deadZone'>>;
  private readonly held = new Set<PlayerAction>();
  private joystick = { x: 0, y: 0, active: false, pointerId: -1 };
  private joystickElement?: HTMLElement;
  private joystickCleanup?: () => void;
  private paused = false;
  private disposed = false;

  private readonly onKeyDown = (event: KeyboardEvent) => {
    if (this.paused || this.isTypingTarget(event.target)) return;
    const action = this.actionForCode(event.code);
    if (!action) return;
    event.preventDefault();
    this.held.add(action);
  };
  private readonly onKeyUp = (event: KeyboardEvent) => {
    const action = this.actionForCode(event.code);
    if (action) { event.preventDefault(); this.held.delete(action); }
  };
  private readonly onBlur = () => this.reset();
  private readonly onVisibility = () => { if (this.documentTarget?.hidden) this.reset(); };

  constructor(options: InputSystemOptions = {}) {
    this.target = options.target ?? window;
    this.documentTarget = options.documentTarget ?? (typeof document !== 'undefined' ? document : undefined);
    this.options = { sensitivity: options.sensitivity ?? 1, deadZone: options.deadZone ?? .12 };
    this.target.addEventListener('keydown', this.onKeyDown);
    this.target.addEventListener('keyup', this.onKeyUp);
    this.target.addEventListener('blur', this.onBlur);
    this.documentTarget?.addEventListener('visibilitychange', this.onVisibility);
  }

  private actionForCode(code: string): PlayerAction | undefined {
    return (Object.keys(ACTION_KEYS) as PlayerAction[]).find(action => ACTION_KEYS[action].includes(code));
  }
  private isTypingTarget(target: EventTarget | null): boolean {
    if (typeof HTMLElement === 'undefined' || !(target instanceof HTMLElement)) return false;
    return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(target.tagName);
  }

  /** UI may bind a dedicated touch Run button without coupling it to movement code. */
  setAction(action: PlayerAction, pressed: boolean): void {
    if (this.paused || this.disposed) return;
    if (pressed) this.held.add(action);
    else this.held.delete(action);
  }

  /** Attach one joystick surface supplied by the UI layer. Its visuals remain UI-owned. */
  attachJoystick(element: HTMLElement, options: JoystickOptions = {}): () => void {
    this.detachJoystick();
    const maxRadius = Math.max(20, options.maxRadius ?? 54);
    const deadZone = options.deadZone ?? this.options.deadZone;
    const sensitivity = options.sensitivity ?? this.options.sensitivity;
    const previousTouchAction = element.style.touchAction;
    const previousOverscroll = element.style.overscrollBehavior;
    this.joystickElement = element;
    const update = (event: PointerEvent) => {
      if (this.joystick.pointerId !== event.pointerId) return;
      event.preventDefault();
      const rect = element.getBoundingClientRect();
      const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
      const dx = event.clientX - cx, dy = event.clientY - cy;
      const length = Math.hypot(dx, dy);
      const scale = length > maxRadius ? maxRadius / length : 1;
      let x = dx * scale / maxRadius * sensitivity;
      let y = -dy * scale / maxRadius * sensitivity;
      const magnitude = Math.hypot(x, y);
      if (magnitude < deadZone) { x = 0; y = 0; }
      else if (magnitude > 1) { x /= magnitude; y /= magnitude; }
      this.joystick = { x, y, active: true, pointerId: event.pointerId };
    };
    const end = (event: PointerEvent) => {
      if (this.joystick.pointerId !== event.pointerId) return;
      event.preventDefault();
      try { element.releasePointerCapture(event.pointerId); } catch { /* capture may already be released */ }
      this.joystick = { x: 0, y: 0, active: false, pointerId: -1 };
    };
    const down = (event: PointerEvent) => {
      if (this.paused || this.joystick.active || event.button !== 0) return;
      event.preventDefault();
      this.joystick.pointerId = event.pointerId;
      this.joystick.active = true;
      try { element.setPointerCapture(event.pointerId); } catch { /* cancel/up still releases input */ }
      update(event);
    };
    element.style.touchAction = 'none';
    element.style.overscrollBehavior = 'contain';
    element.addEventListener('pointerdown', down, { passive: false });
    element.addEventListener('pointermove', update, { passive: false });
    element.addEventListener('pointerup', end, { passive: false });
    element.addEventListener('pointercancel', end, { passive: false });
    element.addEventListener('lostpointercapture', end as EventListener);

    const cleanup = () => {
      element.removeEventListener('pointerdown', down);
      element.removeEventListener('pointermove', update);
      element.removeEventListener('pointerup', end);
      element.removeEventListener('pointercancel', end);
      element.removeEventListener('lostpointercapture', end as EventListener);
      element.style.touchAction = previousTouchAction;
      element.style.overscrollBehavior = previousOverscroll;
      if (this.joystickElement === element) {
        this.joystickElement = undefined;
        this.joystick = { x: 0, y: 0, active: false, pointerId: -1 };
      }
      if (this.joystickCleanup === cleanup) this.joystickCleanup = undefined;
    };
    this.joystickCleanup = cleanup;
    return cleanup;
  }

  private detachJoystick(): void {
    if (this.joystickCleanup) this.joystickCleanup();
    else {
      this.joystick = { x: 0, y: 0, active: false, pointerId: -1 };
      this.joystickElement = undefined;
    }
  }
  getFrame(): PlayerInputFrame {
    if (this.paused || this.disposed) return { moveX: 0, moveY: 0, run: false, active: false, source: 'none' };
    let x = Number(this.held.has('MoveRight')) - Number(this.held.has('MoveLeft'));
    let y = Number(this.held.has('MoveForward')) - Number(this.held.has('MoveBackward'));
    const keyboardActive = x !== 0 || y !== 0;
    const joystickActive = this.joystick.active && (this.joystick.x !== 0 || this.joystick.y !== 0);
    if (joystickActive) { x += this.joystick.x; y += this.joystick.y; }
    const length = Math.hypot(x, y);
    if (length > 1) { x /= length; y /= length; }
    const magnitude = Math.hypot(x, y);
    if (magnitude < this.options.deadZone) { x = 0; y = 0; }
    return {
      moveX: x * this.options.sensitivity, moveY: y * this.options.sensitivity,
      run: this.held.has('Run'), active: x !== 0 || y !== 0,
      source: keyboardActive && joystickActive ? 'mixed' : keyboardActive ? 'keyboard' : joystickActive ? 'joystick' : 'none',
    };
  }
  setPaused(paused: boolean): void { this.paused = paused; if (paused) this.reset(); }
  reset(): void { this.held.clear(); this.joystick = { x: 0, y: 0, active: false, pointerId: -1 }; }
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true; this.reset(); this.detachJoystick();
    this.target.removeEventListener('keydown', this.onKeyDown);
    this.target.removeEventListener('keyup', this.onKeyUp);
    this.target.removeEventListener('blur', this.onBlur);
    this.documentTarget?.removeEventListener('visibilitychange', this.onVisibility);
  }
}
