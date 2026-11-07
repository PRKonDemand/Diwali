import type { AabbObstacle, CircleObstacle, PedestrianAgent, Vec2 } from './types';

const len = (v: Vec2) => Math.hypot(v.x, v.z);
const normalize = (v: Vec2): Vec2 => { const length = len(v) || 1; return { x: v.x / length, z: v.z / length }; }

/** Uniform spatial hash; rebuilt from active pedestrians once per simulation step. */
export class AgentSpatialHash {
  private cells = new Map<string, PedestrianAgent[]>();
  constructor(private readonly cellSize = 6) {}
  private key(x: number, z: number): string { return `${Math.floor(x / this.cellSize)}:${Math.floor(z / this.cellSize)}`; }
  rebuild(agents: Iterable<PedestrianAgent>): void {
    this.cells.clear();
    for (const agent of agents) {
      if (agent.lod === 'culled') continue;
      const key = this.key(agent.position.x, agent.position.z), list = this.cells.get(key) ?? [];
      list.push(agent); this.cells.set(key, list);
    }
  }
  query(position: Vec2, radius: number): PedestrianAgent[] {
    const minX = Math.floor((position.x - radius) / this.cellSize), maxX = Math.floor((position.x + radius) / this.cellSize);
    const minZ = Math.floor((position.z - radius) / this.cellSize), maxZ = Math.floor((position.z + radius) / this.cellSize);
    const found: PedestrianAgent[] = [];
    for (let x = minX; x <= maxX; x++) for (let z = minZ; z <= maxZ; z++) found.push(...(this.cells.get(`${x}:${z}`) ?? []));
    return found;
  }
}

function aabbRepulsion(position: Vec2, box: AabbObstacle, radius: number): Vec2 {
  const closestX = Math.max(box.minX, Math.min(box.maxX, position.x));
  const closestZ = Math.max(box.minZ, Math.min(box.maxZ, position.z));
  let dx = position.x - closestX, dz = position.z - closestZ, distance = Math.hypot(dx, dz);
  if (distance >= radius) return { x: 0, z: 0 };
  if (distance < .001) {
    dx = position.x - (box.minX + box.maxX) / 2; dz = position.z - (box.minZ + box.maxZ) / 2;
    distance = Math.hypot(dx, dz) || 1;
  }
  const force = (radius - distance) / radius;
  return { x: dx / distance * force, z: dz / distance * force };
}
function circleRepulsion(position: Vec2, obstacle: CircleObstacle, radius: number): Vec2 {
  const dx = position.x - obstacle.x, dz = position.z - obstacle.z, distance = Math.hypot(dx, dz) || .001;
  const reach = radius + obstacle.radius;
  if (distance >= reach) return { x: 0, z: 0 };
  const force = (reach - distance) / reach;
  return { x: dx / distance * force, z: dz / distance * force };
}

export interface AvoidanceResult { direction: Vec2; blocked: boolean; nearestDistance: number }
export function calculateAvoidance(agent: PedestrianAgent, desired: Vec2, neighbours: PedestrianAgent[], buildings: AabbObstacle[], vehicles: CircleObstacle[], radius: number, separationWeight: number, obstacleWeight: number): AvoidanceResult {
  let sx = 0, sz = 0, ox = 0, oz = 0, nearest = Infinity;
  for (const other of neighbours) {
    if (other.id === agent.id) continue;
    const dx = agent.position.x - other.position.x, dz = agent.position.z - other.position.z, distance = Math.hypot(dx, dz);
    if (distance > radius * 1.7 || distance < .001) continue;
    nearest = Math.min(nearest, distance);
    const weight = (radius * 1.7 - distance) / (radius * 1.7);
    sx += dx / distance * weight; sz += dz / distance * weight;
  }
  for (const box of buildings) { const force = aabbRepulsion(agent.position, box, radius + 1.2); ox += force.x; oz += force.z; }
  for (const vehicle of vehicles) { const force = circleRepulsion(agent.position, vehicle, radius + 1.5); ox += force.x; oz += force.z; }
  const vx = desired.x + sx * separationWeight + ox * obstacleWeight;
  const vz = desired.z + sz * separationWeight + oz * obstacleWeight;
  const magnitude = Math.hypot(vx, vz), blocked = magnitude < .12;
  return { direction: blocked ? normalize({ x: -desired.z, z: desired.x }) : { x: vx / magnitude, z: vz / magnitude }, blocked, nearestDistance: nearest };
}

/** Static obstacle broad-phase index. Buildings/props are inserted once, not scanned per NPC. */
export class ObstacleSpatialHash {
  private cells = new Map<string, AabbObstacle[]>();
  constructor(private readonly cellSize = 24, obstacles: AabbObstacle[] = []) { this.rebuild(obstacles); }
  private key(x: number, z: number): string { return `${x}:${z}`; }
  rebuild(obstacles: AabbObstacle[]): void {
    this.cells.clear();
    for (const obstacle of obstacles) {
      const x0 = Math.floor(obstacle.minX / this.cellSize), x1 = Math.floor(obstacle.maxX / this.cellSize);
      const z0 = Math.floor(obstacle.minZ / this.cellSize), z1 = Math.floor(obstacle.maxZ / this.cellSize);
      for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
        const key = this.key(x, z), list = this.cells.get(key) ?? [];
        list.push(obstacle); this.cells.set(key, list);
      }
    }
  }
  query(position: Vec2, radius: number): AabbObstacle[] {
    const x0 = Math.floor((position.x - radius) / this.cellSize), x1 = Math.floor((position.x + radius) / this.cellSize);
    const z0 = Math.floor((position.z - radius) / this.cellSize), z1 = Math.floor((position.z + radius) / this.cellSize);
    const unique = new Map<string, AabbObstacle>();
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++)
      for (const obstacle of this.cells.get(this.key(x, z)) ?? []) unique.set(obstacle.id, obstacle);
    return [...unique.values()];
  }
}
