import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { createFestivalDistrict } from "./createFestivalDistrict.js";

const COLORS = {
  grass: 0x3b6542,
  road: 0x3b3d47,
  pavement: 0x8b8278,
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
    new THREE.PlaneGeometry(570, 570),
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

  addRoad(0, 0, 13, 540);
  addRoad(-105, 0, 9, 540);
  addRoad(105, 0, 9, 540);
  [-120, 0, 120].forEach((z) => addRoad(0, z, 540, 9));

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

  [-24.3, 24.3, -90, -120, 90, 120].forEach((x) => {
    for (let z = -246; z <= 246; z += 12) {
      addWalkway(x, z, 3.75, 11.4);
    }
  });

  const dashMaterial = new THREE.MeshBasicMaterial({ color: 0xd8d3c8 });
  for (let z = -246; z <= 246; z += 27) {
    const dash = new THREE.Mesh(
      new THREE.PlaneGeometry(0.48, 11.4),
      dashMaterial
    );
    dash.rotation.x = -Math.PI / 2;
    dash.position.set(0, 0.012, z);
    scene.add(dash);
  }
  addZebraCrossings(scene);
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

  const roof = box(width + 0.62, 0.38, 7.55, 0x73513d);
  roof.position.y = height + 0.18;
  group.add(roof);
  const roofCap = box(width + 0.78, 0.13, 7.7, 0xe8b86d);
  roofCap.position.y = height + 0.39;
  group.add(roofCap);
  const facadeTrim = box(width + 0.12, 0.2, 0.18, 0xffd27e);
  facadeTrim.position.set(0, height - 0.08, 3.58);
  group.add(facadeTrim);
  const baseTrim = box(width + 0.18, 0.24, 0.2, 0x9c6546);
  baseTrim.position.set(0, 0.16, 3.58);
  group.add(baseTrim);
  for (const edgeX of [-width / 2 + 0.18, width / 2 - 0.18]) {
    const column = box(0.28, height - 0.15, 0.25, 0xf0c58a);
    column.position.set(edgeX, height / 2, 3.58);
    group.add(column);
    const capital = box(0.48, 0.2, 0.34, 0xffd98c);
    capital.position.set(edgeX, height - 0.22, 3.62);
    group.add(capital);
  }

  const windowGlow = new THREE.MeshStandardMaterial({
    color: 0xffd28a,
    emissive: 0xffa13b,
    emissiveIntensity: 2.15,
    roughness: 0.5
  });
  const windowDark = new THREE.MeshStandardMaterial({
    color: 0x273448,
    roughness: 0.5
  });

  const columns = Math.max(2, Math.floor(width / 2.5));
  for (let floor = 0; floor < floors; floor += 1) {
    for (let column = 0; column < columns; column += 1) {
      const windowX = -width / 2 + ((column + 0.5) * width) / columns;
      const windowY = 1.55 + floor * 3.15;
      const frame = box(1.04, 1.34, 0.16, 0x8b563b);
      frame.position.set(windowX, windowY, 3.56);
      group.add(frame);
      const pane = new THREE.Mesh(
        new THREE.BoxGeometry(0.82, 1.12, 0.13),
        Math.random() > 0.16 ? windowGlow : windowDark
      );
      pane.position.set(windowX, windowY, 3.67);
      group.add(pane);
      const crossbar = box(0.86, 0.075, 0.08, 0xf1c98d);
      crossbar.position.set(windowX, windowY, 3.76);
      group.add(crossbar);
      const mullion = box(0.075, 1.15, 0.08, 0xf1c98d);
      mullion.position.set(windowX, windowY, 3.76);
      group.add(mullion);
    }
  }

  const doorFrame = box(1.82, 2.55, 0.2, 0xf2c77f);
  doorFrame.position.set(0, 1.28, 3.57);
  group.add(doorFrame);
  const door = box(1.45, 2.25, 0.16, 0x70402b);
  door.position.set(0, 1.12, 3.7);
  group.add(door);
  const doorPanel = box(1.12, 1.78, 0.055, 0x965737);
  doorPanel.position.set(0, 1.12, 3.8);
  group.add(doorPanel);
  const handle = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 10),
    new THREE.MeshStandardMaterial({ color: 0xffd36d, metalness: 0.72, roughness: 0.28 }));
  handle.position.set(0.48, 1.08, 3.86);
  group.add(handle);
  const lintel = box(2.05, 0.16, 0.25, 0xffd477);
  lintel.position.set(0, 2.58, 3.7);
  group.add(lintel);

  if (floors > 1) {
    const balcony = box(width * 0.72, 0.16, 1.05, 0xb7a99b);
    balcony.position.set(0, 3.22, 4.05);
    group.add(balcony);
    const rail = box(width * 0.72, 0.12, 0.12, 0xffd28a);
    rail.position.set(0, 3.96, 4.52);
    group.add(rail);
    for (let post = -3; post <= 3; post += 1) {
      const baluster = box(0.075, 0.62, 0.075, 0xd9b77f);
      baluster.position.set(post * 0.72, 3.68, 4.52);
      group.add(baluster);
    }
  }

  const lightCount = Math.max(24, Math.floor(width * 3.5));
  for (let i = 0; i < lightCount; i += 1) {
    const bulbColor = [0xff4b43, 0xffc34f, 0x55d9ff, 0x7bf0a0, 0xff79cb][i % 5];
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.105, 10, 10),
      new THREE.MeshBasicMaterial({ color: bulbColor })
    );
    const t = i / (lightCount - 1);
    bulb.position.set(-width / 2 + t * width, height - 0.25, 3.82);
    group.add(bulb);
    decorations.bulbs.push(bulb);
  }
  for (let side = -1; side <= 1; side += 2) {
    for (let step = 0; step < 5; step += 1) {
      const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.095, 10, 8),
        new THREE.MeshBasicMaterial({ color: step % 2 ? 0xffd36a : 0xff704b }));
      lantern.position.set(side * (width / 2 - 0.65), 0.75 + step * 0.48, 3.88);
      group.add(lantern);
      decorations.bulbs.push(lantern);
    }
  }
  const toran = box(2.2, 0.12, 0.12, 0x3c9b60);
  toran.position.set(0, 2.78, 3.88);
  group.add(toran);
  for (let leaf = -4; leaf <= 4; leaf += 1) {
    const flower = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8),
      new THREE.MeshBasicMaterial({ color: leaf % 2 ? 0xffd36a : 0xff6d58 }));
    flower.position.set(leaf * 0.23, 2.66, 3.95);
    group.add(flower);
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
    new THREE.SphereGeometry(0.28, 14, 14),
    new THREE.MeshBasicMaterial({ color: 0xffd58a })
  );
  bulb.position.set(x + (x < 0 ? 0.85 : -0.85), 5.12, z);
  scene.add(bulb);

  const light = new THREE.PointLight(0xffc477, 2.1, 19, 1.8);
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


function addZebraCrossings(scene) {
  const paint = new THREE.MeshBasicMaterial({ color: 0xf2eee5, transparent: true, opacity: 0.88 });
  const addStripe = (x, z, width, depth) => {
    const stripe = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), paint);
    stripe.rotation.x = -Math.PI / 2;
    stripe.position.set(x, 0.018, z);
    scene.add(stripe);
  };
  [-120, 0, 120].forEach((z) => {
    for (let offset = -7; offset <= 7; offset += 2.2) addStripe(0, z + offset, 10.5, 0.72);
    for (let offset = -7; offset <= 7; offset += 2.2) addStripe(offset, z, 7.2, 0.55);
  });
  const stopLine = new THREE.MeshBasicMaterial({ color: 0xf0dfbd });
  [-105, 105].forEach((x) => {
    [-120, 0, 120].forEach((z) => {
      const line = new THREE.Mesh(new THREE.PlaneGeometry(7.4, 0.22), stopLine);
      line.rotation.x = -Math.PI / 2;
      line.position.set(x, 0.02, z - 5.5);
      scene.add(line);
    });
  });
}

function addRangoli(scene, x, z, variant = 0) {
  const group = new THREE.Group();
  const colors = [0xff5b63, 0xffd166, 0x55d6a5, 0x62c9ff, 0xc49bff];
  const outer = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.075, 6, 32), new THREE.MeshBasicMaterial({ color: colors[variant % colors.length] }));
  outer.rotation.x = -Math.PI / 2; outer.position.y = 0.045; group.add(outer);
  const inner = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.055, 6, 28), new THREE.MeshBasicMaterial({ color: colors[(variant + 1) % colors.length] }));
  inner.rotation.x = -Math.PI / 2; inner.position.y = 0.05; group.add(inner);
  for (let petal = 0; petal < 12; petal += 1) {
    const angle = petal * Math.PI / 6;
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.19, 8, 6), new THREE.MeshBasicMaterial({ color: colors[(petal + variant) % colors.length] }));
    dot.scale.set(1.25, 0.18, 0.62);
    dot.position.set(Math.cos(angle) * 0.83, 0.065, Math.sin(angle) * 0.83);
    dot.rotation.y = -angle; group.add(dot);
  }
  const centre = new THREE.Mesh(new THREE.CircleGeometry(0.22, 16), new THREE.MeshBasicMaterial({ color: 0xffe5a8, side: THREE.DoubleSide }));
  centre.rotation.x = -Math.PI / 2; centre.position.y = 0.06; group.add(centre);
  group.position.set(x, 0, z); scene.add(group);
}

function addRoadFestoon(scene, z, decorations) {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-28, 6.1, z), new THREE.Vector3(-14, 5.25, z),
    new THREE.Vector3(0, 5.0, z), new THREE.Vector3(14, 5.25, z),
    new THREE.Vector3(28, 6.1, z)
  ]);
  scene.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.035, 5, false), new THREE.MeshStandardMaterial({ color: 0x302a2b, metalness: 0.35 })));
  const colors = [0xff5b4d, 0xffd166, 0x63d9ff, 0x80ed99, 0xff83c7];
  for (let i = 0; i <= 12; i += 1) {
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 8), new THREE.MeshBasicMaterial({ color: colors[i % colors.length] }));
    bulb.position.copy(curve.getPoint(i / 12)); bulb.position.y -= 0.18;
    scene.add(bulb); decorations.bulbs.push(bulb);
  }
}

function addRoadsideCrackerDisplay(scene, x, z) {
  const colors = [0xff6b5e, 0xffc857, 0x59c6ee];
  for (let i = 0; i < 3; i += 1) {
    const pack = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.19, 0.48, 8), new THREE.MeshStandardMaterial({ color: colors[i], roughness: 0.72, metalness: 0.08 }));
    pack.position.set(x + (i - 1) * 0.34, 0.25, z + (i % 2) * 0.12);
    pack.rotation.z = (i - 1) * 0.12; pack.castShadow = true; scene.add(pack);
  }
}

function addSky(scene) {
  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(3.8, 24, 24),
    new THREE.MeshBasicMaterial({ color: 0xffe6b7 })
  );
  moon.position.set(-126, 126, -225);
  scene.add(moon);

  const starPositions = [];
  for (let i = 0; i < 520; i += 1) {
    starPositions.push(
      (Math.random() - 0.5) * 570,
      45 + Math.random() * 225,
      (Math.random() - 0.5) * 570
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

  scene.add(new THREE.HemisphereLight(0xb7c9f4, 0x44301e, 1.65));
  const moonLight = new THREE.DirectionalLight(0xd7ddff, 1.45);
  moonLight.position.set(-24, 38, -25);
  moonLight.castShadow = true;
  moonLight.shadow.mapSize.set(1024, 1024);
  moonLight.shadow.camera.left = -165;
  moonLight.shadow.camera.right = 165;
  moonLight.shadow.camera.top = 210;
  moonLight.shadow.camera.bottom = -210;
  scene.add(moonLight);

  const warmFill = new THREE.PointLight(0xffa34f, 1.8, 78, 1.8);
  warmFill.position.set(0, 8, 0);
  scene.add(warmFill);

  addGround(scene);
  addSky(scene);

  const housePalette = [0xe9a078, 0xf0d09a, 0xe18e8b, 0xe1dfbd, 0xb9d0a5, 0xd7a9df, 0xe8b96f];
  for (let z = -250; z <= 250; z += 20) {
    if ([-120, 0, 120].some((crossing) => Math.abs(z - crossing) <= 10)) continue;
    addHouse(scene, -54, z, "left", 1 + Math.floor(Math.random() * 3), housePalette[Math.floor(Math.random() * housePalette.length)], decorations, blockers);
    addHouse(scene, 54, z, "right", 1 + Math.floor(Math.random() * 3), housePalette[Math.floor(Math.random() * housePalette.length)], decorations, blockers);
    addHouse(scene, -156, z, "left", 1 + Math.floor(Math.random() * 2), housePalette[Math.floor(Math.random() * housePalette.length)], decorations, blockers);
    addHouse(scene, 156, z, "right", 1 + Math.floor(Math.random() * 2), housePalette[Math.floor(Math.random() * housePalette.length)], decorations, blockers);
  }

  for (let z = -240; z <= 240; z += 56) {
    addStreetLamp(scene, -27.6, z, decorations);
    addStreetLamp(scene, 27.6, z, decorations);
    addTree(scene, -81, z + 21);
    addTree(scene, 81, z + 21);
  }

  for (let z = -224; z <= 224; z += 112) addRoadFestoon(scene, z, decorations);
  for (let z = -240; z <= 240; z += 48) {
    addRoadsideCrackerDisplay(scene, -19.2, z + 12);
    addRoadsideCrackerDisplay(scene, 19.2, z - 12);
  }
  for (let z = -240; z <= 240; z += 24) {
    addDiya(scene, -22.05, z, decorations);
    addDiya(scene, 22.05, z, decorations);
  }

  for (let z = -220; z <= 220; z += 60) {
    if ([-120, 0, 120].some((crossing) => Math.abs(z - crossing) < 18)) continue;
    addRangoli(scene, -48.8, z, Math.abs(Math.floor(z / 60)));
    addRangoli(scene, 48.8, z + 18, Math.abs(Math.floor(z / 60)) + 2);
  }
  createFestivalDistrict(scene, decorations, blockers);

  return {
    isBlocked(x, z, radius = 0.48) {
      return blockers.some((item) =>
        Math.abs(x - item.x) < item.halfX + radius &&
        Math.abs(z - item.z) < item.halfZ + radius
      );
    },
    update(time) {
      decorations.bulbs.forEach((bulb, index) => {
        const pulse = 0.88 + Math.sin(time * 2.8 + index * 0.7) * 0.16;
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
