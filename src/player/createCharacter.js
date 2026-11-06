import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

function makeLimb(material, length, radius) {
  const pivot = new THREE.Group();
  const mesh = new THREE.Mesh(
    new THREE.CapsuleGeometry(radius, Math.max(0.05, length - radius * 2), 4, 8),
    material
  );
  mesh.position.y = -length * 0.43;
  mesh.castShadow = true;
  pivot.add(mesh);
  return pivot;
}

export function createCharacter(scene, options = {}) {
  const root = new THREE.Group();
  const scale = options.scale ?? 1;
  const skin = new THREE.MeshStandardMaterial({ color: options.skinColor ?? 0xc98762, roughness: 0.9 });
  const shirt = new THREE.MeshStandardMaterial({ color: options.shirtColor ?? 0x287f9b, roughness: 0.85 });
  const trousers = new THREE.MeshStandardMaterial({ color: options.trouserColor ?? 0x27344a, roughness: 0.9 });
  const hair = new THREE.MeshStandardMaterial({ color: options.hairColor ?? 0x211a18, roughness: 1 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x171b24, roughness: 0.8 });

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 0.55, 5, 10), shirt);
  torso.position.y = 1.12;
  torso.castShadow = true;
  root.add(torso);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 14, 12), skin);
  head.position.y = 1.83;
  head.castShadow = true;
  root.add(head);

  const hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.255, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.48), hair);
  hairCap.position.set(0, 1.91, -0.015);
  root.add(hairCap);

  const eyeGeometry = new THREE.SphereGeometry(0.025, 6, 6);
  [-0.085, 0.085].forEach((x) => {
    const eye = new THREE.Mesh(eyeGeometry, dark);
    eye.position.set(x, 1.85, 0.232);
    root.add(eye);
  });

  const leftArm = makeLimb(skin, 0.7, 0.105);
  const rightArm = makeLimb(skin, 0.7, 0.105);
  leftArm.position.set(-0.39, 1.38, 0);
  rightArm.position.set(0.39, 1.38, 0);
  root.add(leftArm, rightArm);

  const leftSleeve = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), shirt);
  const rightSleeve = leftSleeve.clone();
  leftSleeve.position.set(-0.38, 1.48, 0);
  rightSleeve.position.set(0.38, 1.48, 0);
  root.add(leftSleeve, rightSleeve);

  const leftLeg = makeLimb(trousers, 0.76, 0.13);
  const rightLeg = makeLimb(trousers, 0.76, 0.13);
  leftLeg.position.set(-0.17, 0.78, 0);
  rightLeg.position.set(0.17, 0.78, 0);
  root.add(leftLeg, rightLeg);

  root.scale.setScalar(scale);
  root.position.set(options.x ?? 0, 0, options.z ?? 0);
  root.rotation.y = options.rotation ?? 0;
  scene.add(root);

  return {
    root,
    updateWalk(time, moving) {
      const swing = moving ? Math.sin(time * 9) * 0.62 : 0;
      leftLeg.rotation.x = swing;
      rightLeg.rotation.x = -swing;
      leftArm.rotation.x = -swing * 0.72;
      rightArm.rotation.x = swing * 0.72;
      torso.position.y = 1.12 + (moving ? Math.abs(Math.sin(time * 18)) * 0.035 : 0);
    }
  };
}
