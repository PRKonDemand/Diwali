# Modular Pedestrian & NPC System

A standalone TypeScript gameplay module for the Diwali city simulator. Simulation/AI decisions are separate from Three.js character rendering and animation.

## Modules

- `navigation.ts` — A* routing on the stitched walkable graph.
- `behaviour.ts` — seeded variation, Indian festival clothing palettes, category profiles and destination selection.
- `state-machine.ts` — idle, walking, turning, talking and celebrating transitions.
- `avoidance.ts` — pedestrian spatial hash, static building broad-phase index, separation and vehicle/building steering.
- `system.ts` — individual/group spawning, family followers, district-aware destinations, movement and distance-based simulation updates.
- `renderer.ts` — procedural Three.js characters, shared geometry/materials, animation and far-distance instancing.
- `debug.ts` — optional route, state and collision overlay.

## World adapter

The supplied city architecture describes `CityWorld.roads` as a stitched graph and buildings as footprint bounds. The current GitHub project is a bundled standalone `index.html`; it does not expose the original `src/world/types.ts` modules or graph objects to imports. This package therefore accepts an explicit adapter rather than guessing private bundle fields.

```ts
const world: PedestrianWorldAdapter = {
  navigation: { nodes: cityNodes, edges: cityEdges }, // walkable road/path graph only
  destinations: districtPOIs,
  obstacles: { buildings: buildingAabbs, static: fixedPropAabbs, vehicles: liveVehicleCircles },
  districtAt: (point) => findDistrict(point),
};

const pedestrians = new PedestrianSystem(scene, world, { spawnCount: 180, maxAgents: 420 });
// For low-end mobile, pass MOBILE_PEDESTRIAN_CONFIG as the third argument.
pedestrians.spawnPopulation();

// In the existing animation loop:
pedestrians.update(deltaSeconds, { x: camera.position.x, z: camera.position.z }, liveVehicleCircles);
```

Map graph nodes and edges into `NavigationGraphInput`. Map each building's existing `bounds` to an `AabbObstacle`; optional fixed prop/barrier AABBs go in `obstacles.static`. Vehicle circles must be refreshed from the vehicle simulation. District POIs need tags such as `temple`, `market`, `food`, `park`, `festival`, `home`, or `stage`.

## Debugging

```ts
const debug = new PedestrianDebugOverlay(scene);
debug.update(pedestrians.agents.values(), world.obstacles, cameraXZ, deltaSeconds, true);
const stats = pedestrians.getDebugSnapshot();
```

The overlay draws navigation routes, state-coloured pedestrian markers, building/prop footprints and vehicle collision radii. The snapshot reports state counts, LOD counts, blocked movement attempts and average speed.

## Performance

- Pedestrian-neighbour checks use a spatial hash.
- Static buildings and props use a 24 m obstacle hash instead of a full scan per NPC.
- Near agents update every frame; mid/far agents use staggered lower update rates; distant agents are culled.
- Near characters share procedural geometry/materials; far silhouettes are batched with `InstancedMesh`.
- Default cap: 420 agents. `MOBILE_PEDESTRIAN_CONFIG` starts at 120 max / 80 spawned with slower mid/far updates; profile on target devices before raising it.

## Validation

From this directory run `npm install`, `npm run typecheck`, and `npm test`. This module is isolated and does not alter the existing root `index.html` or deployment configuration.
