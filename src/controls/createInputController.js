export function createInputController({ canvas, joystick, knob, cameraButton }) {
  const keys = new Set();
  const state = { x: 0, y: 0, cameraYaw: 0, cameraDistance: 8.5 };
  let joystickPointer = null;
  let cameraPointer = null;
  let lastPointerX = 0;
  const radius = 34;
  const cameraDistances = [8.5, 11.5, 15];

  function setJoystick(clientX, clientY) {
    const rect = joystick.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const length = Math.hypot(dx, dy);
    if (length > radius) {
      dx = (dx / length) * radius;
      dy = (dy / length) * radius;
    }
    state.x = dx / radius;
    state.y = -dy / radius;
    knob.style.left = "50%";
    knob.style.top = "50%";
    knob.style.transform = "translate(calc(-50% + " + dx + "px), calc(-50% + " + dy + "px))";
  }

  function resetJoystick() {
    state.x = 0;
    state.y = 0;
    joystickPointer = null;
    knob.style.left = "50%";
    knob.style.top = "50%";
    knob.style.transform = "translate(-50%, -50%)";
  }

  joystick.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    joystickPointer = event.pointerId;
    joystick.setPointerCapture(event.pointerId);
    setJoystick(event.clientX, event.clientY);
  });
  joystick.addEventListener("pointermove", (event) => {
    if (event.pointerId === joystickPointer) setJoystick(event.clientX, event.clientY);
  });
  joystick.addEventListener("pointerup", (event) => {
    if (event.pointerId === joystickPointer) resetJoystick();
  });
  joystick.addEventListener("pointercancel", resetJoystick);
  joystick.addEventListener("lostpointercapture", resetJoystick);

  window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) {
      event.preventDefault();
      keys.add(key);
    }
  });
  window.addEventListener("keyup", (event) => keys.delete(event.key.toLowerCase()));
  window.addEventListener("blur", () => {
    keys.clear();
    resetJoystick();
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
    const deltaX = event.clientX - lastPointerX;
    lastPointerX = event.clientX;
    state.cameraYaw -= deltaX * 0.004;
  });
  const stopCameraDrag = (event) => {
    if (event.pointerId === cameraPointer) cameraPointer = null;
  };
  canvas.addEventListener("pointerup", stopCameraDrag);
  canvas.addEventListener("pointercancel", stopCameraDrag);
  canvas.addEventListener("lostpointercapture", () => { cameraPointer = null; });

  cameraButton.addEventListener("click", () => {
    const current = cameraDistances.indexOf(state.cameraDistance);
    state.cameraDistance = cameraDistances[(current + 1) % cameraDistances.length];
  });

  return {
    getMovement() {
      let x = state.x;
      let y = state.y;
      if (keys.has("a") || keys.has("arrowleft")) x -= 1;
      if (keys.has("d") || keys.has("arrowright")) x += 1;
      if (keys.has("w") || keys.has("arrowup")) y += 1;
      if (keys.has("s") || keys.has("arrowdown")) y -= 1;
      const length = Math.hypot(x, y);
      if (length > 1) { x /= length; y /= length; }
      return { x, y };
    },
    getCamera() {
      return { yaw: state.cameraYaw, distance: state.cameraDistance };
    },
    reset() {
      keys.clear();
      resetJoystick();
    }
  };
}
