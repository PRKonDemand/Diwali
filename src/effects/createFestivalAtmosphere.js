import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

const EMBER_COUNT = 110;

function createHazeTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 64;
  const context = canvas.getContext("2d");
  const gradient = context.createRadialGradient(64, 32, 2, 64, 32, 62);
  gradient.addColorStop(0, "rgba(255,190,125,0.32)");
  gradient.addColorStop(0.42, "rgba(225,135,112,0.13)");
  gradient.addColorStop(1, "rgba(150,110,130,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 64);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createFestivalAtmosphere(scene) {
  const positions = new Float32Array(EMBER_COUNT * 3);
  const drift = [];
  for (let i = 0; i < EMBER_COUNT; i += 1) {
    positions[i * 3] = (Math.random() - 0.5) * 500;
    positions[i * 3 + 1] = 1 + Math.random() * 25;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 500;
    drift.push({
      x: (Math.random() - 0.5) * 0.55,
      y: 0.18 + Math.random() * 0.42,
      z: (Math.random() - 0.5) * 0.42,
      phase: Math.random() * Math.PI * 2
    });
  }

  const emberGeometry = new THREE.BufferGeometry();
  emberGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const embers = new THREE.Points(
    emberGeometry,
    new THREE.PointsMaterial({
      color: 0xffb36b,
      size: 0.34,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    })
  );
  embers.frustumCulled = false;
  scene.add(embers);

  const hazeTexture = createHazeTexture();
  const haze = [];
  for (let i = 0; i < 6; i += 1) {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: hazeTexture,
      color: i % 2 ? 0xffb58a : 0xffd09a,
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
      rotation: Math.random() * Math.PI
    }));
    sprite.position.set(
      (Math.random() - 0.5) * 430,
      9 + Math.random() * 9,
      (Math.random() - 0.5) * 430
    );
    const scale = 34 + Math.random() * 30;
    sprite.scale.set(scale, scale * 0.42, 1);
    scene.add(sprite);
    haze.push({ sprite, speed: 0.25 + Math.random() * 0.35, phase: Math.random() * 6 });
  }

  const flashLights = [];
  for (const [x, z, color] of [
    [-115, -175, 0xff8b53],
    [125, -85, 0xffcf75],
    [-95, 155, 0xff6e75],
    [145, 185, 0x8daaff]
  ]) {
    const light = new THREE.PointLight(color, 0, 105, 2);
    light.position.set(x, 18, z);
    scene.add(light);
    flashLights.push(light);
  }

  let nextFlash = 2.5 + Math.random() * 3.5;
  let activeFlash = null;
  let flashAge = 0;

  return {
    update(delta, time) {
      const attribute = emberGeometry.attributes.position;
      for (let i = 0; i < EMBER_COUNT; i += 1) {
        const item = drift[i];
        let x = attribute.getX(i) + item.x * delta;
        let y = attribute.getY(i) + item.y * delta;
        let z = attribute.getZ(i) + item.z * delta;
        if (y > 27) {
          x = (Math.random() - 0.5) * 500;
          y = 1 + Math.random() * 3;
          z = (Math.random() - 0.5) * 500;
        }
        attribute.setXYZ(i, x, y, z);
      }
      attribute.needsUpdate = true;
      embers.material.opacity = 0.55 + Math.sin(time * 1.8) * 0.12;

      haze.forEach(({ sprite, speed, phase }) => {
        sprite.position.x += Math.sin(time * 0.16 + phase) * speed * delta;
        sprite.position.z += Math.cos(time * 0.13 + phase) * speed * delta;
        sprite.material.opacity = 0.085 + (Math.sin(time * 0.42 + phase) + 1) * 0.025;
      });

      nextFlash -= delta;
      if (nextFlash <= 0) {
        activeFlash = Math.floor(Math.random() * flashLights.length);
        flashAge = 0;
        nextFlash = 4.5 + Math.random() * 5.5;
      }
      if (activeFlash !== null) {
        flashAge += delta;
        const strength = Math.max(0, 1 - flashAge / 0.9);
        flashLights.forEach((light, index) => {
          light.intensity = index === activeFlash ? strength * 15 : 0;
        });
        if (strength <= 0) activeFlash = null;
      } else {
        flashLights.forEach((light) => { light.intensity = 0; });
      }
    }
  };
}
