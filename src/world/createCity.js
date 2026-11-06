import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

const COLORS = {
  grass: 0x263c2c,
  road: 0x30333d,
  pavement: 0x777777,
  gold: 0xffc56b,
  warm: 0xffa13b,
  dark: 0x30251f
};

function box(width, height, depth, color, options = {}) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    new THREE.MeshStandardMaterial({
      color,
      roughness: options.roughness ?? 0.88,
      metalness: options.metalness ?? 0
    })
  );
  mesh.castShadow = options.castShadow ?? true;
  mesh.receiveShadow = true;
  return mesh;
}

function addGround(scene) {
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(190, 190),
    new THREE.MeshStandardMaterial({ color: COLORS.grass, roughness: 1 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.12;
  ground.receiveShadow = true;
  scene.add(ground);

  const roadMaterial = new THREE.MeshStandardMaterial({
    color: COLORS.road,
    roughness: 0.96
  });

  const addRoad = (x, z, width, length) => {
    const road = new THREE.Mesh(
      new THREE.PlaneGeometry(width, length),
      roadMaterial
    );
    road.rotation.x = -Math.PI / 2;
    road.position.set(x, -0.045, z);
    road.receiveShadow = true;
    scene.add(road);
  };

  addRoad(0, 0, 13, 180);
  addRoad(-35, 0, 9, 180);
  addRoad(35, 0, 9, 180);
  [-40, 0, 40].forEach((z) => addRoad(0, z, 180, 9));

  const pavementMaterial = new THREE.MeshStandardMaterial({
    color: COLORS.pavement,
    roughness: 1
  });

  const addWalkway = (x, z, width, depth) => {
    const path = new THREE.Mesh(
      new THREE.BoxGeometry(width, 0.28, depth),
      pavementMaterial
    );
    path.position.set(x, 0.02, z);
    path.receiveShadow = true;
    scene.add(path);
  };

  [-8.1, 8.1, -30, -40, 30, 40].forEach((x) => {
    for (let z = -82; z <= 82; z += 4) {
      addWalkway(x, z, 1.25, 3.8);
    }
  });

  const dashMaterial = new THREE.MeshBasicMaterial({ color: 0xd8d3c8 });
  for (let z = -82; z <= 82; z += 9) {
    const dash = new THREE.Mesh(
      new THREE.PlaneGeometry(0.16, 3.8),
      dashMaterial
    );
    dash.rotation.x = -Math.PI / 2;
    dash.position.set(0, 0.012, z);
    scene.add(dash);
  }
}

function addHouse(scene, x, z, side, floors, palette, decorations, blockers) {
  const group = new THREE.Group();
  const width = 8 + (floors % 2) * 1.2;
  const height = floors * 3.15;
  const wall = new THREE.MeshStandardMaterial({
    color: palette,
    roughness: 0.92
  });

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, 7),
    wall
  );
  body.position.y = height / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const roof = box(width + 0.45, 0.32, 7.35, 0x59483c);
  roof.position.y = height + 0.16;
  group.add(roof);

  const windowGlow = new THREE.MeshStandardMaterial({
    color: 0xffd28a,
    emissive: 0xffa13b,
    emissiveIntensity: 1.1,
    roughness: 0.5
  });
  const windowDark = new THREE.MeshStandardMaterial({
    color: 0x273448,
    roughness: 0.5
  });

  const columns = Math.max(2, Math.floor(width / 2.5));
  for (let floor = 0; floor < floors; floor += 1) {
    for (let column = 0; column < columns; column += 1) {
      const pane = new THREE.Mesh(
        new THREE.BoxGeometry(0.82, 1.12, 0.13),
        Math.random() > 0.22 ? windowGlow : windowDark
      );
      pane.position.set(
        -width / 2 + ((column + 0.5) * width) / columns,
        1.55 + floor * 3.15,
        3.57
      );
      group.add(pane);
    }
  }

  const door = box(1.45, 2.25, 0.16, 0x593a2a);
  door.position.set(0, 1.12, 3.62);
  group.add(door);

  const lintel = box(1.8, 0.13, 0.2, 0xe5b85e);
  lintel.position.set(0, 2.32, 3.68);
  group.add(lintel);

  if (floors > 1) {
    const balcony = box(width * 0.72, 0.16, 1.05, 0xb7a99b);
    balcony.position.set(0, 3.22, 4.05);
    group.add(balcony);
    const rail = box(width * 0.72, 0.72, 0.1, 0x695d55);
    rail.position.set(0, 3.62, 4.52);
    group.add(rail);
  }

  const lightCount = Math.max(12, Math.floor(width * 2.5));
  for (let i = 0; i < lightCount; i += 1) {
    const bulbColor = [0xff4b43, 0xffc34f, 0x55d9ff, 0x7bf0a0, 0xff79cb][i % 5];
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.085, 8, 8),
      new THREE.MeshBasicMaterial({ color: bulbColor })
    );
    const t = i / (lightCount - 1);
    bulb.position.set(-width / 2 + t * width, height - 0.25, 3.72);
    group.add(bulb);
    decorations.bulbs.push(bulb);
  }

  group.position.set(x, 0, z);
  blockers.push({ x, z, halfX: 3.8, halfZ: width / 2 + 0.35 });
  group.rotation.y = side === "left" ? Math.PI / 2 : -Math.PI / 2;
  scene.add(group);
}

function addStreetLamp(scene, x, z, decorations) {
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.13, 5.4, 8),
    new THREE.MeshStandardMaterial({ color: 0x252b35, metalness: 0.55, roughness: 0.55 })
  );
  pole.position.set(x, 2.7, z);
  pole.castShadow = true;
  scene.add(pole);

  const arm = box(1.05, 0.12, 0.12, 0x252b35, { metalness: 0.5 });
  arm.position.set(x + (x < 0 ? 0.42 : -0.42), 5.25, z);
  scene.add(arm);

  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 12, 12),
    new THREE.MeshBasicMaterial({ color: 0xffd58a })
  );
  bulb.position.set(x + (x < 0 ? 0.85 : -0.85), 5.12, z);
  scene.add(bulb);

  const light = new THREE.PointLight(0xffbd70, 1.45, 15, 2);
  light.position.copy(bulb.position);
  scene.add(light);
  decorations.lamps.push(light);
}

function addTree(scene, x, z) {
  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.3, 2.8, 8),
    new THREE.MeshStandardMaterial({ color: 0x67442d })
  );
  trunk.position.y = 1.4;
  tree.add(trunk);

  const crown = new THREE.Mesh(
    new THREE.SphereGeometry(1.65, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0x1e6841, roughness: 1 })
  );
  crown.position.y = 3.45;
  crown.scale.set(1, 1.15, 1);
  crown.castShadow = true;
  tree.add(crown);
  tree.position.set(x, 0, z);
  scene.add(tree);
}

function addDiya(scene, x, z, decorations) {
  const bowl = new THREE.Mesh(
    new THREE.SphereGeometry(0.27, 12, 8),
    new THREE.MeshStandardMaterial({
      color: 0xb95c24,
      roughness: 0.55,
      metalness: 0.12
    })
  );
  bowl.scale.y = 0.38;
  bowl.position.set(x, 0.12, z);
  scene.add(bowl);

  const flame = new THREE.Mesh(
    new THREE.ConeGeometry(0.075, 0.28, 8),
    new THREE.MeshBasicMaterial({ color: 0xffa12f })
  );
  flame.position.set(x, 0.29, z);
  scene.add(flame);
  decorations.flames.push(flame);
}

function addSky(scene) {
  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(3.8, 24, 24),
    new THREE.MeshBasicMaterial({ color: 0xffe6b7 })
  );
  moon.position.set(-42, 42, -75);
  scene.add(moon);

  const starPositions = [];
  for (let i = 0; i < 520; i += 1) {
    starPositions.push(
      (Math.random() - 0.5) * 190,
      15 + Math.random() * 75,
      (Math.random() - 0.5) * 190
    );
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(starPositions, 3));
  const stars = new THREE.Points(
    geometry,
    new THREE.PointsMaterial({ color: 0xfff2d8, size: 0.28, sizeAttenuation: true })
  );
  scene.add(stars);
}

export function createCity(scene) {
  const decorations = { bulbs: [], flames: [], lamps: [] };
  const blockers = [];

  scene.add(new THREE.HemisphereLight(0x9baedb, 0x282016, 1.35));
  const moonLight = new THREE.DirectionalLight(0xc4d4ff, 1.25);
  moonLight.position.set(-24, 38, -25);
  moonLight.castShadow = true;
  moonLight.shadow.mapSize.set(1024, 1024);
  moonLight.shadow.camera.left = -55;
  moonLight.shadow.camera.right = 55;
  moonLight.shadow.camera.top = 70;
  moonLight.shadow.camera.bottom = -70;
  scene.add(moonLight);

  const warmFill = new THREE.PointLight(0xff9d48, 1.3, 65, 2);
  warmFill.position.set(0, 8, 0);
  scene.add(warmFill);

  addGround(scene);
  addSky(scene);

  const housePalette = [0xd99a75, 0xe7c28d, 0xc98b83, 0xd5d2b8, 0xaeb8a2, 0xc9a6d5];
  for (let z = -70; z <= 70; z += 20) {
    addHouse(scene, -18, z, "left", 1 + Math.floor(Math.random() * 3), housePalette[Math.floor(Math.random() * housePalette.length)], decorations, blockers);
    addHouse(scene, 18, z, "right", 1 + Math.floor(Math.random() * 3), housePalette[Math.floor(Math.random() * housePalette.length)], decorations, blockers);
    addHouse(scene, -52, z, "left", 1 + Math.floor(Math.random() * 2), housePalette[Math.floor(Math.random() * housePalette.length)], decorations, blockers);
    addHouse(scene, 52, z, "right", 1 + Math.floor(Math.random() * 2), housePalette[Math.floor(Math.random() * housePalette.length)], decorations, blockers);
  }

  for (let z = -70; z <= 70; z += 28) {
    addStreetLamp(scene, -9.2, z, decorations);
    addStreetLamp(scene, 9.2, z, decorations);
    addTree(scene, -27, z + 7);
    addTree(scene, 27, z + 7);
  }

  for (let z = -72; z <= 72; z += 8) {
    addDiya(scene, -7.35, z, decorations);
    addDiya(scene, 7.35, z, decorations);
  }

  return {
    isBlocked(x, z, radius = 0.48) {
      return blockers.some((item) =>
        Math.abs(x - item.x) < item.halfX + radius &&
        Math.abs(z - item.z) < item.halfZ + radius
      );
    },
    update(time) {
      decorations.bulbs.forEach((bulb, index) => {
        const pulse = 0.78 + Math.sin(time * 2.2 + index * 0.7) * 0.22;
        bulb.scale.setScalar(pulse);
      });
      decorations.flames.forEach((flame, index) => {
        flame.scale.y = 0.82 + Math.sin(time * 7 + index) * 0.18;
        flame.rotation.z = Math.sin(time * 5 + index) * 0.08;
      });
      decorations.lamps.forEach((lamp, index) => {
        lamp.intensity = 1.25 + Math.sin(time * 1.8 + index) * 0.08;
      });
    }
  };
}
