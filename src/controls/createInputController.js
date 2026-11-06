export function createInputController({ canvas, directionButtons, cameraButton }) {
  const keys = new Set();
  const pressedDirections = new Set();
  const pointerDirections = new Map();
  const state = { cameraYaw: 0, cameraDistance: 8.5 };
  let cameraPointer = null;
  let lastPointerX = 0;
  const cameraDistances = [8.5, 11.5, 15];

  function setDirection(direction, pressed) {
    if (pressed) pressedDirections.add(direction);
    else pressedDirections.delete(direction);
    directionButtons.forEach((button) => {
      const active = button.dataset.direction === direction && pressed;
      if (active) {
        button.classList.add("is-pressed");
        button.setAttribute("aria-pressed", "true");
      } else if (button.dataset.direction === direction) {
        button.classList.remove("is-pressed");
        button.setAttribute("aria-pressed", "false");
      }
    });
  }

  function releasePointer(pointerId) {
    const direction = pointerDirections.get(pointerId);
    if (!direction) return;
    pointerDirections.delete(pointerId);
    setDirection(direction, false);
  }

  directionButtons.forEach((button) => {
    const direction = button.dataset.direction;
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("contextmenu", (event) => event.preventDefault());
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      pointerDirections.set(event.pointerId, direction);
      setDirection(direction, true);
      button.setPointerCapture(event.pointerId);
    });
    button.addEventListener("pointerup", (event) => releasePointer(event.pointerId));
    button.addEventListener("pointercancel", (event) => releasePointer(event.pointerId));
    button.addEventListener("lostpointercapture", (event) => releasePointer(event.pointerId));
    button.addEventListener("click", (event) => event.preventDefault());
  });

  const keyToDirection = {
    w: "up", arrowup: "up",
    s: "down", arrowdown: "down",
    a: "left", arrowleft: "left",
    d: "right", arrowright: "right"
  };
  window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if (!keyToDirection[key]) return;
    event.preventDefault();
    keys.add(key);
  });
  window.addEventListener("keyup", (event) => keys.delete(event.key.toLowerCase()));

  function clearMovement() {
    keys.clear();
    pointerDirections.forEach((direction) => setDirection(direction, false));
    pointerDirections.clear();
    pressedDirections.clear();
    directionButtons.forEach((button) => {
      button.classList.remove("is-pressed");
      button.setAttribute("aria-pressed", "false");
    });
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
      let x = 0;
      let y = 0;
      if (keys.has("a") || keys.has("arrowleft") || pressedDirections.has("left")) x -= 1;
      if (keys.has("d") || keys.has("arrowright") || pressedDirections.has("right")) x += 1;
      if (keys.has("w") || keys.has("arrowup") || pressedDirections.has("up")) y += 1;
      if (keys.has("s") || keys.has("arrowdown") || pressedDirections.has("down")) y -= 1;
      const length = Math.hypot(x, y);
      if (length > 1) { x /= length; y /= length; }
      return { x, y };
    },
    getCamera() {
      return { yaw: state.cameraYaw, distance: state.cameraDistance };
    },
    reset() {
      clearMovement();
    }
  };
}
