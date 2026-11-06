import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { createCity } from "./world/createCity.js";
import { createPedestrians } from "./world/createPedestrians.js";
import { createCharacter } from "./player/createCharacter.js";
import { createInputController } from "./controls/createInputController.js";
import { createFireworks } from "./effects/createFireworks.js";

const $ = (selector) => document.querySelector(selector);
const canvas = $("#world");
const loading = $("#loading");
const loadingLabel = $("#loading-label");
const intro = $("#intro");
const hud = $("#hud");
const startButton = $("#start-button");
const helpTip = $("#help-tip");
const locationLabel = $("#location-label");
const pauseButton = $("#pause-button");
const pausePanel = $("#pause-panel");
const resumeButton = $("#resume-button");
const fireButton = $("#fire-button");
const toast = $("#toast");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x080d1b);
scene.fog = new THREE.Fog(0x080d1b, 42, 155);

const camera = new THREE.PerspectiveCamera(62, 1, 0.1, 260);
camera.position.set(0, 5.2, -7);
camera.lookAt(0, 1.2, 5);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
  powerPreference: "high-performance"
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const city = createCity(scene);
const player = createCharacter(scene, {
  x: 0,
  z: 5,
  scale: 1.08,
  shirtColor: 0x287fba,
  trouserColor: 0x263248,
  skinColor: 0xc98762
});
const pedestrians = createPedestrians(scene, 14);
const fireworks = createFireworks(scene);
const input = createInputController({
  canvas,
  joystick: $("#joystick"),
  knob: $("#joystick-knob"),
  cameraButton: $("#camera-button")
});

const clock = new THREE.Clock();
const cameraTarget = new THREE.Vector3();
const desiredCameraPosition = new THREE.Vector3();
let hasEnteredCity = false;
let paused = false;
let elapsed = 0;
let lastFireAt = 0;
let toastTimeout = 0;

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}
window.addEventListener("resize", resize, { passive: true });
resize();

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => toast.classList.remove("is-visible"), 1700);
}

function setPaused(nextState) {
  paused = nextState;
  pausePanel.hidden = !paused;
  pauseButton.textContent = paused ? "▶" : "Ⅱ";
  pauseButton.setAttribute("aria-label", paused ? "Resume game" : "Pause game");
  input.reset();
  if (paused) showToast("Game paused");
}

function enterCity() {
  if (hasEnteredCity) return;
  hasEnteredCity = true;
  intro.classList.add("is-hidden");
  hud.hidden = false;
  helpTip.textContent = "WASD / arrows or joystick to walk · Drag to rotate camera";
  showToast("Welcome to Diwali City");
}
startButton.addEventListener("click", enterCity);
pauseButton.addEventListener("click", () => setPaused(!paused));
resumeButton.addEventListener("click", () => setPaused(false));

fireButton.addEventListener("click", () => {
  if (!hasEnteredCity || paused) return;
  const now = performance.now();
  if (now - lastFireAt < 550) return;
  lastFireAt = now;
  const direction = new THREE.Vector3(
    Math.sin(player.root.rotation.y),
    0,
    Math.cos(player.root.rotation.y)
  );
  const position = player.root.position.clone().addScaledVector(direction, 9);
  position.y = 4.2 + Math.random() * 1.6;
  fireworks.launch(position);
  showToast("A little festival sparkle!");
});

function updatePlayer(delta) {
  if (paused || !hasEnteredCity) {
    player.updateWalk(elapsed, false);
    return;
  }

  const movement = input.getMovement();
  const cameraInput = input.getCamera();
  const viewYaw = player.root.rotation.y + cameraInput.yaw;
  const forwardX = Math.sin(viewYaw);
  const forwardZ = Math.cos(viewYaw);
  const rightX = Math.cos(viewYaw);
  const rightZ = -Math.sin(viewYaw);

  const moveX = rightX * movement.x + forwardX * movement.y;
  const moveZ = rightZ * movement.x + forwardZ * movement.y;
  const magnitude = Math.hypot(moveX, moveZ);
  const isMoving = magnitude > 0.08;

  if (isMoving) {
    const step = 4.25 * delta;
    const nextX = THREE.MathUtils.clamp(player.root.position.x + moveX * step, -84, 84);
    const nextZ = THREE.MathUtils.clamp(player.root.position.z + moveZ * step, -84, 84);

    if (!city.isBlocked(nextX, player.root.position.z)) {
      player.root.position.x = nextX;
    }
    if (!city.isBlocked(player.root.position.x, nextZ)) {
      player.root.position.z = nextZ;
    }
    player.root.rotation.y = Math.atan2(moveX, moveZ);
  }

  player.updateWalk(elapsed, isMoving);
  locationLabel.textContent = Math.abs(player.root.position.z) < 18 ? "Main Street" : "Festival Lane";
}

function updateCamera(delta) {
  const cameraInput = input.getCamera();
  const yaw = player.root.rotation.y + cameraInput.yaw;
  const distance = cameraInput.distance;
  desiredCameraPosition.set(
    player.root.position.x - Math.sin(yaw) * distance,
    player.root.position.y + 4.1 + distance * 0.16,
    player.root.position.z - Math.cos(yaw) * distance
  );
  const smoothing = 1 - Math.exp(-delta * 5.5);
  camera.position.lerp(desiredCameraPosition, smoothing);
  cameraTarget.set(player.root.position.x, 1.15, player.root.position.z);
  camera.lookAt(cameraTarget);
}

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05);
  elapsed += delta;

  if (!paused) {
    city.update(elapsed);
    pedestrians.update(delta, elapsed, false);
    fireworks.update(delta);
  }

  updatePlayer(delta);
  if (hasEnteredCity) updateCamera(delta);
  renderer.render(scene, camera);
}
animate();

document.addEventListener("visibilitychange", () => {
  if (document.hidden && hasEnteredCity && !paused) setPaused(true);
});

loadingLabel.textContent = "Your Diwali neighbourhood is ready";
window.setTimeout(() => loading.classList.add("is-hidden"), 1100);

console.info("Diwali City: gameplay modules loaded");
