import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { createCity } from "./world/createCity.js";
import { createPedestrians } from "./world/createPedestrians.js";
import { createCharacter } from "./player/createCharacter.js";
import { createCar } from "./player/createCar.js";
import { createVehicleMovement } from "./player/createVehicleMovement.js";
import { createPlayerMovement } from "./player/createPlayerMovement.js";
import { createFollowCamera } from "./camera/createFollowCamera.js";
import { createInputController } from "./controls/createInputController.js";
import { createFireworks } from "./effects/createFireworks.js";
import { createFestivalAudio } from "./effects/createFestivalAudio.js";
import { createFestivalAtmosphere } from "./effects/createFestivalAtmosphere.js";
import { createDistrictSystem } from "./world/createDistrictSystem.js";
import { createMinimap } from "./ui/createMinimap.js";

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
const carButton = $("#car-button");
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
const districtSystem = createDistrictSystem();
const minimap = createMinimap($("#minimap"), districtSystem.districts);
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
const car = createCar(scene);
const vehicleMovement = createVehicleMovement({ THREE, player, car, city, input });
const followCamera = createFollowCamera({ THREE, camera, player, input });

const clock = new THREE.Clock();
let hasEnteredCity = false;
let driving = false;
let paused = false;
let settingsOpen = false;
let elapsed = 0;
let lastFireAt = 0;
let toastTimeout = 0;
let lastMinimapUpdate = 0;

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

function toggleDriving() {
  if (!hasEnteredCity || paused || settingsOpen) return;
  driving = !driving;
  input.reset();
  if (driving) {
    car.root.position.copy(player.root.position);
    car.root.rotation.y = player.root.rotation.y;
    car.setVisible(true);
    player.root.visible = false;
    carButton.classList.add("is-driving");
    carButton.querySelector("small").textContent = "EXIT CAR";
    carButton.setAttribute("aria-label", "Exit car");
    helpTip.textContent = "Joystick / W A S D to drive · Drag to rotate camera";
    showToast("You're in the driver's seat");
  } else {
    vehicleMovement.stop();
    car.setVisible(false);
    player.root.visible = true;
    carButton.classList.remove("is-driving");
    carButton.querySelector("small").textContent = "DRIVE";
    carButton.setAttribute("aria-label", "Get in the car");
    helpTip.textContent = "Move with the joystick or use WASD · Drag to rotate camera";
    showToast("Back on foot");
  }
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
carButton.addEventListener("click", toggleDriving);
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
    if (driving) vehicleMovement.update(delta);
    else movement.update(delta, elapsed);
    const x = driving ? car.root.position.x : player.root.position.x;
    const z = driving ? car.root.position.z : player.root.position.z;
    const templeDistance = Math.hypot(x - 205, z - 65);
    const plazaDistance = Math.hypot(x + 205, z - 65);
    const district = districtSystem.getCurrentDistrict(x, z);
    if (templeDistance < 32) locationLabel.textContent = "Lakshmi–Ganesh Mandir";
    else if (plazaDistance < 32) locationLabel.textContent = "Food & Social Plaza";
    else locationLabel.textContent = district ? district.name : "Outer Ring Road";
  }
  if (hasEnteredCity) followCamera.update(delta, driving, car);
  if (hasEnteredCity && elapsed - lastMinimapUpdate >= 0.1) {
    const subject = driving ? car.root : player.root;
    minimap.update(subject.position, subject.rotation.y);
    lastMinimapUpdate = elapsed;
  }
  renderer.render(scene, camera);
}
animate();

document.addEventListener("visibilitychange", () => {
  if (document.hidden && hasEnteredCity && !paused) setPaused(true);
});

loadingLabel.textContent = "Your Diwali neighbourhood is ready";
window.setTimeout(() => loading.classList.add("is-hidden"), 1100);
console.info("Diwali City: gameplay modules loaded");
