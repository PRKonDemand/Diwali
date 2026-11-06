import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

export function createCar(scene) {
  const root = new THREE.Group();
  const paint = new THREE.MeshStandardMaterial({ color: 0xc63f32, metalness: 0.58, roughness: 0.3 });
  const darkPaint = new THREE.MeshStandardMaterial({ color: 0x252b35, metalness: 0.42, roughness: 0.42 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x182b3d, metalness: 0.32, roughness: 0.2 });
  const chrome = new THREE.MeshStandardMaterial({ color: 0xc8d2d9, metalness: 0.82, roughness: 0.22 });
  const lamp = new THREE.MeshStandardMaterial({ color: 0xfff0bd, emissive: 0xffc46b, emissiveIntensity: 1.8 });
  const tailLamp = new THREE.MeshStandardMaterial({ color: 0xff332c, emissive: 0xb81712, emissiveIntensity: 1.3 });

  function part(geometry, material, position, parent = root) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  part(new THREE.BoxGeometry(1.92, 0.52, 3.9), paint, [0, 0.72, 0]);
  part(new THREE.BoxGeometry(1.82, 0.22, 3.45), darkPaint, [0, 0.47, -0.04]);
  part(new THREE.BoxGeometry(1.48, 0.72, 1.9), paint, [0, 1.28, -0.22]);
  part(new THREE.BoxGeometry(1.39, 0.56, 1.78), glass, [0, 1.31, -0.22]);
  part(new THREE.BoxGeometry(1.98, 0.12, 0.16), chrome, [0, 0.66, 1.98]);
  part(new THREE.BoxGeometry(1.98, 0.12, 0.16), chrome, [0, 0.66, -1.98]);
  part(new THREE.BoxGeometry(1.22, 0.12, 0.12), darkPaint, [0, 0.58, 2.07]);
  part(new THREE.BoxGeometry(1.2, 0.1, 0.1), chrome, [0, 0.55, -2.07]);

  for (const side of [-1, 1]) {
    part(new THREE.BoxGeometry(0.12, 0.42, 0.12), chrome, [side * 0.98, 1.02, 0.68]);
    part(new THREE.BoxGeometry(0.1, 0.1, 0.22), lamp, [side * 0.72, 0.82, 1.98]);
    part(new THREE.BoxGeometry(0.1, 0.12, 0.22), tailLamp, [side * 0.72, 0.82, -1.98]);
    part(new THREE.BoxGeometry(0.12, 0.12, 0.42), chrome, [side * 0.98, 0.78, 0.15]);
  }

  const wheels = [];
  for (const x of [-0.98, 0.98]) {
    for (const z of [-1.28, 1.28]) {
      const wheel = new THREE.Group();
      wheel.position.set(x, 0.43, z);
      const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.39, 0.39, 0.24, 18), darkPaint);
      tire.rotation.z = Math.PI / 2;
      tire.castShadow = true;
      wheel.add(tire);
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.255, 14), chrome);
      hub.rotation.z = Math.PI / 2;
      wheel.add(hub);
      root.add(wheel);
      wheels.push(wheel);
    }
  }

  const frontGlow = new THREE.PointLight(0xffd99a, 0.7, 10, 2);
  frontGlow.position.set(0, 0.8, 2.15);
  root.add(frontGlow);

  root.visible = false;
  scene.add(root);

  return {
    root,
    setVisible(visible) { root.visible = visible; },
    update(delta, speed) {
      const spin = speed * delta / 0.39;
      wheels.forEach((wheel) => { wheel.rotation.x += spin; });
    }
  };
}
