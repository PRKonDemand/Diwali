import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

const mat = (color, roughness = 0.78, metalness = 0) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness });

function addBox(parent, size, material, position, cast = true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...position);
  mesh.castShadow = cast;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addCylinder(parent, radiusTop, radiusBottom, height, material, position, segments = 16) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments),
    material
  );
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addSphere(parent, radius, material, position, scale = [1, 1, 1]) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 16, 12), material);
  mesh.position.set(...position);
  mesh.scale.set(...scale);
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}

function makeSign(text, background, foreground, width = 512, height = 128) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = "#f5d58d";
  ctx.lineWidth = 9;
  ctx.strokeRect(8, 8, width - 16, height - 16);
  ctx.fillStyle = foreground;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "bold 46px Georgia, serif";
  ctx.fillText(text, width / 2, height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshBasicMaterial({ map: texture });
}

function addTemple(scene, decorations, blockers) {
  const group = new THREE.Group();
  const stone = mat(0xe9c994);
  const lightStone = mat(0xffe3b0);
  const deepStone = mat(0x9c563d);
  const gold = mat(0xe9ae45, 0.32, 0.62);
  const red = mat(0xa93237);
  const teal = mat(0x267b72);
  const floor = mat(0xd7b27e);

  addBox(group, [30, 0.6, 27], deepStone, [0, 0.3, 0]);
  addBox(group, [27.5, 0.35, 24.5], lightStone, [0, 0.77, 0]);
  addBox(group, [21, 0.5, 17], stone, [0, 1.18, 0]);
  addBox(group, [20.2, 0.22, 16.2], gold, [0, 1.54, 0]);
  addBox(group, [17.5, 7.2, 13.5], stone, [0, 5.2, 0.2]);
  addBox(group, [18.8, 0.45, 14.8], lightStone, [0, 8.95, 0.2]);
  addBox(group, [17.8, 0.22, 13.8], gold, [0, 9.28, 0.2]);

  // Deep entrance porch with carved-looking columns and capitals.
  addBox(group, [12.8, 0.3, 4.2], floor, [0, 1.82, 8.45]);
  for (const x of [-5.2, -1.75, 1.75, 5.2]) {
    addCylinder(group, 0.36, 0.48, 5.7, lightStone, [x, 4.65, 8.5], 12);
    addCylinder(group, 0.52, 0.52, 0.28, gold, [x, 7.55, 8.5], 12);
    addCylinder(group, 0.52, 0.52, 0.28, gold, [x, 1.95, 8.5], 12);
    for (let ring = 0; ring < 3; ring += 1) {
      const band = addCylinder(group, 0.39 + ring * 0.025, 0.39 + ring * 0.025, 0.1, deepStone, [x, 3.1 + ring * 1.1, 8.5], 12);
    }
  }
  addBox(group, [14.2, 0.55, 0.7], gold, [0, 7.75, 8.5]);
  addBox(group, [12.8, 0.3, 0.65], red, [0, 8.18, 8.5]);

  // Tiered shikhara and small corner finials.
  for (let tier = 0; tier < 5; tier += 1) {
    const width = 15.8 - tier * 2.25;
    const depth = 12.1 - tier * 1.7;
    const y = 9.55 + tier * 1.35;
    addBox(group, [width, 0.72, depth], tier % 2 ? lightStone : stone, [0, y, 0.2]);
    addBox(group, [width + 0.22, 0.12, depth + 0.22], gold, [0, y + 0.39, 0.2]);
  }
  addCylinder(group, 0.28, 0.65, 1.5, gold, [0, 17.0, 0.2], 12);
  addSphere(group, 0.58, gold, [0, 17.85, 0.2], [0.75, 1.25, 0.75]);
  addSphere(group, 0.16, red, [0, 18.65, 0.2]);
  for (const [x, z] of [[-8, -5], [8, -5], [-8, 5], [8, 5]]) {
    addCylinder(group, 0.18, 0.42, 1.1, gold, [x, 9.8, z], 10);
    addSphere(group, 0.3, red, [x, 10.45, z], [0.7, 1.3, 0.7]);
  }

  // Sanctum doorway and symbolic festive idols, kept stylised and respectful.
  addBox(group, [6.5, 5.6, 0.45], deepStone, [0, 4.55, 7.05]);
  addBox(group, [5.4, 4.8, 0.2], mat(0x281c25), [0, 4.45, 7.32], false);
  addBox(group, [5.8, 0.22, 0.45], gold, [0, 7.25, 7.42]);
  const idolBase = mat(0xb77a3b, 0.45, 0.3);
  const idolGold = mat(0xffd16b, 0.34, 0.42);
  const idolPink = mat(0xd87583);
  const idolGreen = mat(0x429b78);
  for (const [x, isGanesh] of [[-1.45, false], [1.45, true]]) {
    addBox(group, [2.25, 0.38, 1.25], idolBase, [x, 2.15, 7.7]);
    addSphere(group, 0.78, idolGold, [x, 3.35, 7.72], [0.9, 1.05, 0.72]);
    addSphere(group, 0.48, isGanesh ? idolPink : idolGold, [x, 4.3, 7.76], [0.92, 1.05, 0.72]);
    addCylinder(group, 0.1, 0.1, 1.35, gold, [x - 0.78, 3.55, 7.7], 10);
    addCylinder(group, 0.1, 0.1, 1.35, gold, [x + 0.78, 3.55, 7.7], 10);
    addSphere(group, 0.19, idolGreen, [x - 0.82, 4.35, 7.75], [0.55, 1.4, 0.4]);
    addSphere(group, 0.19, idolGreen, [x + 0.82, 4.35, 7.75], [0.55, 1.4, 0.4]);
    if (isGanesh) {
      addSphere(group, 0.26, idolPink, [x, 4.02, 8.28], [0.55, 1.5, 0.6]);
      addSphere(group, 0.22, idolPink, [x - 0.45, 4.35, 7.75], [1.2, 0.6, 0.6]);
      addSphere(group, 0.22, idolPink, [x + 0.45, 4.35, 7.75], [1.2, 0.6, 0.6]);
    } else {
      addSphere(group, 0.13, red, [x - 0.18, 4.34, 8.38]);
      addSphere(group, 0.13, red, [x + 0.18, 4.34, 8.38]);
      addSphere(group, 0.28, idolGold, [x, 5.05, 7.74], [0.55, 1.35, 0.55]);
    }
    addSphere(group, 0.12, gold, [x, 3.1, 8.28]);
  }

  const sign = new THREE.Mesh(new THREE.PlaneGeometry(12.5, 1.7), makeSign("SHRI LAKSHMI • GANESH MANDIR", "#542b2d", "#ffe3a1"));
  sign.position.set(0, 8.45, 8.92);
  group.add(sign);
  sign.castShadow = false;

  // Entrance steps, flower garlands and warm diya rows.
  for (let step = 0; step < 4; step += 1) {
    addBox(group, [8.5 - step * 0.75, 0.22, 1.0], step % 2 ? lightStone : stone, [0, 1.0 + step * 0.22, 10.5 + step * 0.75]);
  }
  for (let i = 0; i < 15; i += 1) {
    const x = -6.5 + i * 0.93;
    const flower = addSphere(group, 0.16, i % 2 ? mat(0xffa43d) : mat(0xd94f48), [x, 8.08, 8.96], [1, 0.8, 0.8]);
    flower.castShadow = false;
  }
  for (let side = -1; side <= 1; side += 2) {
    for (let z = -8; z <= 10; z += 2) {
      const bowl = addSphere(group, 0.22, mat(0xb85b28, 0.55, 0.1), [side * 12.2, 0.95, z], [1, 0.35, 1]);
      const flame = addSphere(group, 0.11, mat(0xffa12f, 0.3), [side * 12.2, 1.12, z], [0.7, 1.7, 0.7]);
      decorations.flames.push(flame);
      const glow = new THREE.PointLight(0xffa94e, 0.65, 5, 2);
      glow.position.set(side * 12.2, 1.35, z);
      group.add(glow);
    }
  }

  group.position.set(205, 0, 65);
  scene.add(group);
  blockers.push({ x: 205, z: 65, halfX: 15.8, halfZ: 14.5 });
  const courtyard = new THREE.PointLight(0xffbd69, 5.5, 42, 1.8);
  courtyard.position.set(205, 12, 65);
  scene.add(courtyard);
  decorations.lamps.push(courtyard);
}

function addMarketStall(parent, x, z, title, canopyColor, signText, decorations) {
  const wood = mat(0x68402b);
  const canopy = mat(canopyColor);
  const cream = mat(0xffe0ae);
  addBox(parent, [6.4, 0.3, 3.6], wood, [x, 1.35, z]);
  addBox(parent, [6.8, 0.22, 3.9], cream, [x, 1.58, z]);
  for (const dx of [-2.9, 2.9]) {
    addBox(parent, [0.18, 3.2, 0.18], wood, [x + dx, 2.95, z - 1.65]);
    addBox(parent, [0.18, 3.2, 0.18], wood, [x + dx, 2.95, z + 1.65]);
  }
  const roof = addBox(parent, [7.1, 0.35, 4.2], canopy, [x, 4.65, z]);
  roof.rotation.z = 0.015;
  for (let stripe = -3; stripe <= 3; stripe += 1) {
    addBox(parent, [0.92, 0.12, 4.25], stripe % 2 ? cream : canopy, [x + stripe * 1.02, 4.45, z], false);
  }
  addBox(parent, [6.7, 0.42, 0.28], wood, [x, 2.3, z + 1.85]);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 1.05), makeSign(signText, "#533124", "#ffe3a7", 512, 128));
  sign.position.set(x, 3.65, z + 2.02);
  parent.add(sign);
  sign.castShadow = false;
  for (let i = 0; i < 5; i += 1) {
    const bulb = addSphere(parent, 0.12, mat([0xffc95d, 0xff7b56, 0x7bd8ff, 0x8fe0a3, 0xffa4d0][i]), [x - 2.4 + i * 1.2, 4.15, z + 2.08]);
    decorations.bulbs.push(bulb);
  }
  // Display bowls, trays and small produce/sweet assortments.
  for (let i = 0; i < 4; i += 1) {
    const tray = addCylinder(parent, 0.52, 0.52, 0.08, mat(0xd9a34d, 0.38, 0.38), [x - 2.2 + i * 1.45, 1.78, z + 0.55], 20);
    tray.castShadow = false;
    for (let j = 0; j < 5; j += 1) {
      const sweet = addSphere(parent, 0.13, mat([0xd98b42, 0xf1c96a, 0xb85b42, 0xe6a3a0][(i + j) % 4]), [x - 2.2 + i * 1.45 + (j - 2) * 0.16, 1.91, z + 0.55 + Math.sin(j) * 0.12]);
      sweet.castShadow = false;
    }
  }
}

function addFoodSocialPlaza(scene, decorations, blockers) {
  const group = new THREE.Group();
  const paving = mat(0xb58b66);
  const edge = mat(0x6e5548);
  addBox(group, [31, 0.5, 27], edge, [0, 0.25, 0]);
  addBox(group, [29.8, 0.18, 25.8], paving, [0, 0.59, 0]);
  // Patterned paving bands.
  for (let x = -13; x <= 13; x += 2.6) {
    const strip = addBox(group, [0.07, 0.025, 23], mat(x % 2 ? 0xd4ad81 : 0x987456), [x, 0.7, 0]);
    strip.castShadow = false;
  }
  const stallData = [
    [-8.4, -7.2, "SWEETS", 0x9f3943, "MITHAI"],
    [0, -7.2, "CHAI", 0x397b69, "CHAI • TEA"],
    [8.4, -7.2, "FLOWERS", 0xd18b36, "PHOOL"]
  ];
  stallData.forEach(([x, z, title, color, sign]) => addMarketStall(group, x, z, title, color, sign, decorations));

  // Communal seating, tables and festoon poles.
  const tableTop = mat(0x8b5434);
  const bench = mat(0x60412f);
  for (const x of [-8, 0, 8]) {
    addCylinder(group, 0.95, 0.95, 0.18, tableTop, [x, 1.35, 6.0], 20);
    addCylinder(group, 0.14, 0.22, 1.2, edge, [x, 0.78, 6.0], 12);
    for (const z of [3.4, 8.6]) {
      addBox(group, [4.2, 0.28, 0.75], bench, [x, 0.85, z]);
      for (const dx of [-1.5, 1.5]) addBox(group, [0.16, 0.82, 0.16], edge, [x + dx, 0.48, z]);
    }
  }
  for (const x of [-14, 14]) {
    addCylinder(group, 0.18, 0.25, 5.5, edge, [x, 3.35, -1], 10);
    const lantern = addSphere(group, 0.48, mat(0xffbd59, 0.3, 0.15), [x, 5.9, -1], [0.8, 1.3, 0.8]);
    decorations.bulbs.push(lantern);
    const light = new THREE.PointLight(0xffb75a, 2.4, 17, 1.8);
    light.position.set(x, 5.6, -1);
    group.add(light);
  }
  // Festive archway and flower pots.
  addBox(group, [29, 0.35, 0.45], mat(0x397a50), [0, 5.7, -12]);
  for (let x = -13; x <= 13; x += 1.3) {
    addSphere(group, 0.15, mat(x % 2 ? 0xffc85b : 0xff765e), [x, 5.45, -12], [1.1, 0.8, 0.8]);
  }
  for (const x of [-13, 13]) {
    addCylinder(group, 0.22, 0.42, 1.0, mat(0x9c5338), [x, 1.1, 10], 12);
    addSphere(group, 0.8, mat(0x357a49), [x, 2.0, 10], [1, 1.2, 1]);
  }
  group.position.set(-205, 0, 65);
  scene.add(group);
  blockers.push({ x: -205, z: 65, halfX: 15.8, halfZ: 14.0 });
  const plazaLight = new THREE.PointLight(0xffad61, 4.8, 42, 1.7);
  plazaLight.position.set(-205, 11, 65);
  scene.add(plazaLight);
  decorations.lamps.push(plazaLight);
}

export function createFestivalDistrict(scene, decorations, blockers) {
  addTemple(scene, decorations, blockers);
  addFoodSocialPlaza(scene, decorations, blockers);
}
