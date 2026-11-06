import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

const PALETTE = [0xffcf70, 0xff694f, 0x69d9ff, 0xff78c8, 0x9cff9a, 0xffffff];

export function createFireworks(scene) {
  const bursts = [];

  function launch(position) {
    const count = 72;
    const positions = new Float32Array(count * 3);
    const velocities = [];
    const color = new THREE.Color(PALETTE[Math.floor(Math.random() * PALETTE.length)]);

    for (let i = 0; i < count; i += 1) {
      positions[i * 3] = position.x;
      positions[i * 3 + 1] = position.y;
      positions[i * 3 + 2] = position.z;

      const angle = Math.random() * Math.PI * 2;
      const vertical = Math.random() * 2 - 1;
      const horizontal = Math.sqrt(1 - vertical * vertical);
      const speed = 2.4 + Math.random() * 4.3;
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
      size: 0.24,
      transparent: true,
      opacity: 1,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const points = new THREE.Points(geometry, material);
    scene.add(points);
    bursts.push({ points, velocities, age: 0, lifetime: 1.65 });
  }

  return {
    launch,
    update(delta) {
      for (let index = bursts.length - 1; index >= 0; index -= 1) {
        const burst = bursts[index];
        burst.age += delta;
        const positions = burst.points.geometry.attributes.position;
        for (let i = 0; i < burst.velocities.length; i += 1) {
          const velocity = burst.velocities[i];
          velocity.y -= 3.8 * delta;
          positions.setXYZ(
            i,
            positions.getX(i) + velocity.x * delta,
            positions.getY(i) + velocity.y * delta,
            positions.getZ(i) + velocity.z * delta
          );
          velocity.multiplyScalar(0.992);
        }
        positions.needsUpdate = true;
        burst.points.material.opacity = Math.max(0, 1 - burst.age / burst.lifetime);
        if (burst.age >= burst.lifetime) {
          scene.remove(burst.points);
          burst.points.geometry.dispose();
          burst.points.material.dispose();
          bursts.splice(index, 1);
        }
      }
    }
  };
}
