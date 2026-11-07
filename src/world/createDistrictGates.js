import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

const ENTRANCES = [
  { name: "RESIDENTIAL COLONY", subtitle: "NEIGHBOURHOOD", x: -105, z: -180, color: 0x70c99b },
  { name: "MAIN MARKET", subtitle: "SHOPPING • FOOD • LIGHTS", x: 0, z: -180, color: 0xf0b45d },
  { name: "FESTIVAL SQUARE", subtitle: "TEMPLE • CELEBRATIONS", x: 175, z: 65, color: 0xf28a67 },
  { name: "PREMIUM COLONY", subtitle: "GARDEN RESIDENCES", x: 105, z: 180, color: 0xa99af0 },
  { name: "HIGHWAY DISTRICT", subtitle: "CITY OUTER ROUTE", x: 0, z: 240, color: 0x6fc6dc },
  { name: "CITY CENTRE", subtitle: "THE HEART OF DIWALI CITY", x: 0, z: 0, color: 0xf1d477 }
];

function createSignMaterial(title, subtitle, color) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#171d2b";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#" + color.toString(16).padStart(6, "0");
  ctx.lineWidth = 14;
  ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#fff1d3";
  ctx.font = "900 66px system-ui, sans-serif";
  ctx.fillText(title, 512, 104);
  ctx.fillStyle = "#" + color.toString(16).padStart(6, "0");
  ctx.font = "700 28px system-ui, sans-serif";
  ctx.fillText(subtitle, 512, 184);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
}

function addEntrance(scene, entrance) {
  const group = new THREE.Group();
  const accent = new THREE.Color(entrance.color);
  const stone = new THREE.MeshStandardMaterial({ color: 0x423b3a, roughness: 0.72 });
  const trim = new THREE.MeshStandardMaterial({ color: entrance.color, roughness: 0.34, metalness: 0.28 });
  const postGeometry = new THREE.BoxGeometry(0.72, 5.4, 0.8);

  for (const x of [-9.2, 9.2]) {
    const post = new THREE.Mesh(postGeometry, stone);
    post.position.set(x, 2.7, 0);
    post.castShadow = true;
    post.receiveShadow = true;
    group.add(post);

    const cap = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.32, 1.08), trim);
    cap.position.set(x, 5.5, 0);
    cap.castShadow = true;
    group.add(cap);

    const base = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.38, 1.2), trim);
    base.position.set(x, 0.22, 0);
    group.add(base);
  }

  const beam = new THREE.Mesh(new THREE.BoxGeometry(19.1, 0.55, 1.0), stone);
  beam.position.set(0, 5.45, 0);
  beam.castShadow = true;
  group.add(beam);

  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(15.4, 2.2),
    createSignMaterial(entrance.name, entrance.subtitle, entrance.color)
  );
  sign.position.set(0, 4.45, 0.56);
  group.add(sign);

  for (let index = 0; index < 9; index += 1) {
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.13, 10, 8),
      new THREE.MeshBasicMaterial({ color: index % 2 ? 0xffe5a3 : entrance.color })
    );
    bulb.position.set(-7.6 + index * 1.9, 5.02, 0.62);
    group.add(bulb);
  }

  const glow = new THREE.PointLight(entrance.color, 1.8, 24, 1.8);
  glow.position.set(0, 5.5, 1.5);
  group.add(glow);

  group.position.set(entrance.x, 0, entrance.z);
  scene.add(group);
  return { group, glow, accent };
}

export function createDistrictGates(scene) {
  return ENTRANCES.map((entrance) => addEntrance(scene, entrance));
}
