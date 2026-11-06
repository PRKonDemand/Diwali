import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { createCity } from "./world/createCity.js";
import { createPedestrians } from "./world/createPedestrians.js";
import { createCharacter } from "./player/createCharacter.js";
import { createPlayerMovement } from "./player/createPlayerMovement.js";
import { createFollowCamera } from "./camera/createFollowCamera.js";
import { createInputController } from "./controls/createInputController.js";
import { createFireworks } from "./effects/createFireworks.js";
import { createFestivalAudio } from "./effects/createFestivalAudio.js";
import { createFestivalAtmosphere } from "./effects/createFestivalAtmosphere.js";

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
const settingsButton = $("#settings-button");
const settingsOverlay = $("#settings-overlay");
const settingsClose = $("#settings-close");
const settingsReset = $("#settings-reset");
const speedSlider = $("#movement-speed");
const speedValue = $("#movement-speed-value");
const sensitivitySlider = $("#movement-sensitivity");
const sensitivityValue = $("#movement-sensitivity-value");
const pausePanel = $("#pause-panel");
const resumeButton = $("#resume-button");
const fireButton = $("#fire-button");
const toast = $("#toast");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x080d1b);
scene.fog = new THREE.Fog(0x080d1b, 126, 465);

const camera = new THREE.PerspectiveCamera(62, 1, 0.1, 900);
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
const pedestrians = createPedestrians(scene, 30);
const festivalAudio = createFestivalAudio();
const fireworks = createFireworks(scene, () => festivalAudio.playBurst());
const festivalAtmosphere = createFestivalAtmosphere(scene);
const input = createInputController({
  canvas,
  joystickBase: $("#joystick-base"),
  joystickKnob: $("#joystick-knob"),
  cameraButton: $("#camera-button")
});
const movement = createPlayerMovement({ THREE, player, city, input, speed: 7.5 });
const followCamera = createFollowCamera({ THREE, camera, player, input });

const clock = new THREE.Clock();
let hasEnteredCity = false;
let paused = false;
let settingsOpen = false;
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
  if (paused) closeSettings();
  pausePanel.hidden = !paused;
  pauseButton.textContent = paused ? "▶" : "Ⅱ";
  pauseButton.setAttribute("aria-label", paused ? "Resume game" : "Pause game");
  input.reset();
  if (paused) showToast("Game paused");
}

function enterCity() {
  if (hasEnteredCity) return;
  hasEnteredCity = true;
  festivalAudio.unlock();
  intro.classList.add("is-hidden");
  hud.hidden = false;
  helpTip.textContent = "Move with the joystick or use WASD · Drag to rotate camera";
  showToast("Welcome to Diwali City");
}
function openSettings() {
  if (!hasEnteredCity || paused || settingsOpen) return;
  settingsOpen = true;
  settingsOverlay.hidden = false;
  input.reset();
}

function closeSettings() {
  settingsOpen = false;
  settingsOverlay.hidden = true;
}

function applyMovementSettings() {
  const speed = Number(speedSlider.value);
  const sensitivity = Number(sensitivitySlider.value);
  movement.setSpeed(speed);
  input.setSensitivity(sensitivity);
  speedValue.value = speed.toFixed(1);
  speedValue.textContent = speed.toFixed(1);
  sensitivityValue.value = sensitivity.toFixed(1) + "×";
  sensitivityValue.textContent = sensitivity.toFixed(1) + "×";
}

startButton.addEventListener("click", enterCity);
pauseButton.addEventListener("click", () => setPaused(!paused));
settingsButton.addEventListener("click", openSettings);
settingsClose.addEventListener("click", closeSettings);
settingsOverlay.addEventListener("click", (event) => {
  if (event.target === settingsOverlay) closeSettings();
});
speedSlider.addEventListener("input", applyMovementSettings);
sensitivitySlider.addEventListener("input", applyMovementSettings);
settingsReset.addEventListener("click", () => {
  speedSlider.value = "7.5";
  sensitivitySlider.value = "1";
  applyMovementSettings();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && settingsOpen) closeSettings();
});
applyMovementSettings();
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

function updateWorld(delta) {
  if (paused || settingsOpen || !hasEnteredCity) return;
  city.update(elapsed);
  pedestrians.update(delta, elapsed, false);
  fireworks.update(delta);
  festivalAtmosphere.update(delta, elapsed);
}

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 1 / 30);
  elapsed += delta;
  updateWorld(delta);
  if (hasEnteredCity && !paused && !settingsOpen) {
    movement.update(delta, elapsed);
    const x = player.root.position.x;
    const z = player.root.position.z;
    const templeDistance = Math.hypot(x - 205, z - 65);
    const plazaDistance = Math.hypot(x + 205, z - 65);
    if (templeDistance < 34) locationLabel.textContent = "Lakshmi–Ganesh Mandir";
    else if (plazaDistance < 34) locationLabel.textContent = "Food & Social Plaza";
    else locationLabel.textContent = Math.abs(z) < 54 ? "Main Street" : "Festival Lane";
  }
  if (hasEnteredCity) followCamera.update(delta);
  renderer.render(scene, camera);
}
animate();

document.addEventListener("visibilitychange", () => {
  if (document.hidden && hasEnteredCity && !paused) setPaused(true);
});

loadingLabel.textContent = "Your Diwali neighbourhood is ready";
window.setTimeout(() => loading.classList.add("is-hidden"), 1100);
console.info("Diwali City: gameplay modules loaded");
