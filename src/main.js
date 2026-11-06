import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

const canvas = document.querySelector("#world");
const loading = document.querySelector("#loading");
const loadingLabel = document.querySelector("#loading-label");
const intro = document.querySelector("#intro");
const hud = document.querySelector("#hud");
const startButton = document.querySelector("#start-button");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x080d1b);
scene.fog = new THREE.Fog(0x080d1b, 35, 145);

const camera = new THREE.PerspectiveCamera(62, 1, 0.1, 250);
camera.position.set(0, 5, 12);

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

scene.add(new THREE.HemisphereLight(0x9baedb, 0x282016, 1.5));
const moonLight = new THREE.DirectionalLight(0xc4d4ff, 1.4);
moonLight.position.set(-24, 38, -25);
moonLight.castShadow = true;
moonLight.shadow.mapSize.set(1024, 1024);
scene.add(moonLight);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(180, 180),
  new THREE.MeshStandardMaterial({ color: 0x24342b, roughness: 1 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.08;
ground.receiveShadow = true;
scene.add(ground);

const road = new THREE.Mesh(
  new THREE.PlaneGeometry(13, 170),
  new THREE.MeshStandardMaterial({ color: 0x30333d, roughness: 0.95 })
);
road.rotation.x = -Math.PI / 2;
road.position.y = -0.035;
road.receiveShadow = true;
scene.add(road);

const moon = new THREE.Mesh(
  new THREE.SphereGeometry(4, 24, 24),
  new THREE.MeshBasicMaterial({ color: 0xffe4b0 })
);
moon.position.set(-38, 37, -72);
scene.add(moon);

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}
window.addEventListener("resize", resize, { passive: true });
resize();

let running = false;
startButton.addEventListener("click", () => {
  running = true;
  intro.classList.add("is-hidden");
  hud.hidden = false;
  document.querySelector("#help-tip").textContent =
    "Your city is ready · Movement controls will arrive in the next build part";
});

function animate() {
  requestAnimationFrame(animate);
  moon.rotation.y += 0.0002;
  renderer.render(scene, camera);
}
animate();

loadingLabel.textContent = "City foundation ready";
window.setTimeout(() => loading.classList.add("is-hidden"), 900);

console.info("Diwali City foundation loaded", { running });
