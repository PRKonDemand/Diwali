export function createInputController({ canvas, joystickBase, joystickKnob, cameraButton }) {
  const keys = new Set();
  const state = { cameraYaw: 0, cameraDistance: 8.5, cameraMode: "third", sensitivity: 1, cameraPreset: 1 };
  const movement = { x: 0, y: 0 };
  let joystickPointer = null;
  let cameraPointer = null;
  let lastPointerX = 0;
  const cameraPresets = [
    { mode: "first", distance: 0, label: "First-person camera" },
    { mode: "third", distance: 8.5, label: "Third-person close camera" },
    { mode: "third", distance: 11.5, label: "Third-person medium camera" },
    { mode: "third", distance: 15, label: "Third-person wide camera" }
  ];
  const maxTravel = 39;
  const deadZone = 0.1;

  function applyCameraPreset() {
    const preset = cameraPresets[state.cameraPreset];
    state.cameraMode = preset.mode;
    state.cameraDistance = preset.distance;
    cameraButton.setAttribute("aria-label", preset.label);
    cameraButton.title = preset.label;
  }

  function resetJoystick() {
    joystickPointer = null;
    movement.x = 0;
    movement.y = 0;
    joystickBase.classList.remove("is-active");
    joystickKnob.style.left = "50%";
    joystickKnob.style.top = "50%";
  }

  function updateJoystick(event) {
    const rect = joystickBase.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    let dx = event.clientX - centerX;
    let dy = event.clientY - centerY;
    const distance = Math.hypot(dx, dy);
    const clampedDistance = Math.min(distance, maxTravel);
    if (distance > 0) {
      dx = dx / distance * clampedDistance;
      dy = dy / distance * clampedDistance;
    }
    const normalizedX = dx / maxTravel;
    const normalizedY = -dy / maxTravel;
    const strength = Math.hypot(normalizedX, normalizedY);
    if (strength < deadZone) {
      movement.x = 0;
      movement.y = 0;
    } else {
      const adjustedStrength = Math.min(1, (strength - deadZone) / (1 - deadZone));
      const responsiveStrength = Math.pow(adjustedStrength, 1 / state.sensitivity);
      movement.x = normalizedX / strength * responsiveStrength;
      movement.y = Math.abs(normalizedY) < 1e-9 ? 0 : normalizedY / strength * responsiveStrength;
    }
    joystickKnob.style.left = "calc(50% + " + dx + "px)";
    joystickKnob.style.top = "calc(50% + " + dy + "px)";
  }

  joystickBase.addEventListener("pointerdown", (event) => {
    if (joystickPointer !== null) return;
    event.preventDefault();
    joystickPointer = event.pointerId;
    joystickBase.classList.add("is-active");
    joystickBase.setPointerCapture(event.pointerId);
    updateJoystick(event);
  });
  joystickBase.addEventListener("pointermove", (event) => {
    if (event.pointerId === joystickPointer) updateJoystick(event);
  });
  const releaseJoystick = (event) => {
    if (event.pointerId === joystickPointer) resetJoystick();
  };
  joystickBase.addEventListener("pointerup", releaseJoystick);
  joystickBase.addEventListener("pointercancel", releaseJoystick);
  joystickBase.addEventListener("lostpointercapture", releaseJoystick);
  joystickBase.addEventListener("contextmenu", (event) => event.preventDefault());

  const keyToDirection = { w:"up",arrowup:"up",s:"down",arrowdown:"down",a:"left",arrowleft:"left",d:"right",arrowright:"right" };
  window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if (!keyToDirection[key]) return;
    event.preventDefault();
    keys.add(key);
  });
  window.addEventListener("keyup", (event) => keys.delete(event.key.toLowerCase()));

  function clearMovement() {
    keys.clear();
    resetJoystick();
  }
  window.addEventListener("blur", () => {
    clearMovement();
    cameraPointer = null;
  });

  canvas.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    cameraPointer = event.pointerId;
    lastPointerX = event.clientX;
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener("pointermove", (event) => {
    if (event.pointerId !== cameraPointer) return;
    state.cameraYaw -= (event.clientX - lastPointerX) * 0.004;
    lastPointerX = event.clientX;
  });
  const stopCameraDrag = (event) => {
    if (event.pointerId === cameraPointer) cameraPointer = null;
  };
  canvas.addEventListener("pointerup", stopCameraDrag);
  canvas.addEventListener("pointercancel", stopCameraDrag);
  canvas.addEventListener("lostpointercapture", () => { cameraPointer = null; });

  cameraButton.addEventListener("click", () => {
    state.cameraPreset = (state.cameraPreset + 1) % cameraPresets.length;
    applyCameraPreset();
  });
  applyCameraPreset();

  return {
    getMovement() {
      let x = movement.x;
      let y = movement.y;
      if (keys.has("a") || keys.has("arrowleft")) x -= 1;
      if (keys.has("d") || keys.has("arrowright")) x += 1;
      if (keys.has("w") || keys.has("arrowup")) y += 1;
      if (keys.has("s") || keys.has("arrowdown")) y -= 1;
      const length = Math.hypot(x, y);
      if (length > 1) { x /= length; y /= length; }
      return { x, y };
    },
    getCamera() { return { yaw: state.cameraYaw, distance: state.cameraDistance, mode: state.cameraMode }; },
    setSensitivity(value) {
      state.sensitivity = Math.min(2, Math.max(0.5, Number(value) || 1));
    },
    reset() { clearMovement(); }
  };
}