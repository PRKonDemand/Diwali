import { createCharacter } from "../player/createCharacter.js";

const SHIRTS = [0xd94f45, 0x387bba, 0x4f9c69, 0xa16ab3, 0xd39b3f, 0xe2e2dc];
const SKINS = [0xb97955, 0xd49a72, 0x986448, 0xe0b18b];

export function createPedestrians(scene, count = 12) {
  const walkers = [];
  const lanes = [-30.6, 30.6, -95.4, 95.4];

  for (let index = 0; index < count; index += 1) {
    const direction = index % 2 === 0 ? 1 : -1;
    const lane = lanes[index % lanes.length];
    const child = index % 4 === 0;
    const person = createCharacter(scene, {
      x: lane + (Math.random() - 0.5) * 0.7,
      z: -195 + Math.random() * 390,
      scale: child ? 0.68 : 0.88 + Math.random() * 0.12,
      rotation: direction > 0 ? 0 : Math.PI,
      shirtColor: SHIRTS[index % SHIRTS.length],
      skinColor: SKINS[index % SKINS.length],
      trouserColor: index % 2 ? 0x293448 : 0x514034
    });

    walkers.push({
      person,
      direction,
      speed: child ? 1.15 + Math.random() * 0.35 : 0.75 + Math.random() * 0.45,
      phase: Math.random() * Math.PI * 2,
      lane
    });
  }

  return {
    update(delta, elapsed, paused) {
      walkers.forEach((walker) => {
        if (!paused) {
          walker.person.root.position.z += walker.direction * walker.speed * delta;
          if (walker.person.root.position.z > 228) walker.person.root.position.z = -228;
          if (walker.person.root.position.z < -228) walker.person.root.position.z = 228;
        }
        walker.person.updateWalk(elapsed + walker.phase, !paused);
      });
    }
  };
}
