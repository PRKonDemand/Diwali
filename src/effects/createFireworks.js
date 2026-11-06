import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

const PALETTE = [
  0xffd166, 0xff704f, 0x62dcff, 0xff78c8,
  0x9dff9b, 0xffffff, 0xb69aff, 0xff9b42
];
const MAX_BURSTS = 12;

export function createFireworks(scene) {
  const bursts = [];
  let nextAutomaticLaunch = 4.2 + Math.random() * 1.6;

  function removeBurst(index) {
    const burst = bursts[index];
    scene.remove(burst.points);
    burst.points.geometry.dispose();
    burst.points.material.dispose();
    bursts.splice(index, 1);
  }

  function launch(position, options = {}) {
    const count = options.count ?? (105 + Math.floor(Math.random() * 55));
    const positions = new Float32Array(count * 3);
    const velocities = [];
    const color = new THREE.Color(options.color ?? PALETTE[Math.floor(Math.random() * PALETTE.length)]);
    const style = options.style ?? ["sphere", "ring", "willow"][Math.floor(Math.random() * 3)];

    for (let i = 0; i < count; i += 1) {
      positions[i * 3] = position.x;
      positions[i * 3 + 1] = position.y;
      positions[i * 3 + 2] = position.z;

      const angle = Math.random() * Math.PI * 2;
      const vertical = style === "ring"
        ? (Math.random() - 0.5) * 0.18
        : style === "willow"
          ? Math.random() * 0.9 + 0.1
          : Math.random() * 2 - 1;
      const horizontal = Math.sqrt(Math.max(0, 1 - vertical * vertical));
      const speed = style === "willow"
        ? 2 + Math.random() * 3.2
        : 3.1 + Math.random() * 4.8;
      velocities.push(new THREE.Vector3(
        Math.cos(angle) * horizontal * speed,
        vertical * speed,
        Math.sin(angle) * horizontal * speed
      ));
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color,
      size: style === "ring" ? 0.29 : 0.25,
      transparent: true,
      opacity: 1,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });
    const points = new THREE.Points(geometry, material);
    scene.add(points);
    bursts.push({ points, velocities, age: 0, lifetime: style === "willow" ? 2.25 : 1.9 });

    while (bursts.length > MAX_BURSTS) removeBurst(0);
  }

  function launchAutomaticShow() {
    const color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
    const position = new THREE.Vector3(
      (Math.random() - 0.5) * 440,
      60 + Math.random() * 60,
      (Math.random() - 0.5) * 440
    );
    launch(position, { color, style: ["sphere", "ring", "willow"][Math.floor(Math.random() * 3)] });

    if (Math.random() < 0.22) {
      const secondPosition = position.clone();
      secondPosition.x += (Math.random() - 0.5) * 17;
      secondPosition.y += 3 + Math.random() * 7;
      secondPosition.z += (Math.random() - 0.5) * 12;
      launch(secondPosition, { color: PALETTE[Math.floor(Math.random() * PALETTE.length)] });
    }
  }

  return {
    launch,
    update(delta) {
      nextAutomaticLaunch -= delta;
      if (nextAutomaticLaunch <= 0) {
        launchAutomaticShow();
        nextAutomaticLaunch = 4.2 + Math.random() * 1.6;
      }

      for (let index = bursts.length - 1; index >= 0; index -= 1) {
        const burst = bursts[index];
        burst.age += delta;
        const positions = burst.points.geometry.attributes.position;
        for (let i = 0; i < burst.velocities.length; i += 1) {
          const velocity = burst.velocities[i];
          velocity.y -= 2.7 * delta;
          positions.setXYZ(
            i,
            positions.getX(i) + velocity.x * delta,
            positions.getY(i) + velocity.y * delta,
            positions.getZ(i) + velocity.z * delta
          );
          velocity.multiplyScalar(0.994);
        }
        positions.needsUpdate = true;
        burst.points.material.opacity = Math.max(0, 1 - burst.age / burst.lifetime);
        burst.points.material.size = 0.25 + Math.sin(burst.age * 15) * 0.025;
        if (burst.age >= burst.lifetime) removeBurst(index);
      }
    }
  };
}
