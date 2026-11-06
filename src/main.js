import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { createCity } from "./world/createCity.js";

const canvas = document.querySelector("#world");
const loading = document.querySelector("#loading");
const loadingLabel = document.querySelector("#loading-label");
const intro = document.querySelector("#intro");
const hud = document.querySelector("#hud");
const startButton = document.querySelector("#start-button");
const helpTip = document.querySelector("#help-tip");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x080d1b);
scene.fog = new THREE.Fog(0x080d1b, 42, 155);

const camera = new THREE.PerspectiveCamera(62, 1, 0.1, 260);
camera.position.set(0, 5.2, 13);
camera.lookAt(0, 1.5, 0);

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
const clock = new THREE.Clock();

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}
window.addEventListener("resize", resize, { passive: true });
resize();

let hasEnteredCity = false;
startButton.addEventListener("click", () => {
  hasEnteredCity = true;
  intro.classList.add("is-hidden");
  hud.hidden = false;
  helpTip.textContent = "Look around the festive neighbourhood";
});

function animate() {
  requestAnimationFrame(animate);
  const elapsed = clock.getElapsedTime();
  city.update(elapsed);
  renderer.render(scene, camera);
}
animate();

loadingLabel.textContent = "Diwali neighbourhood is ready";
window.setTimeout(() => loading.classList.add("is-hidden"), 1100);

console.info("Diwali City: environment module loaded", { hasEnteredCity });
