import * as THREE from 'three';
import type { PedestrianAgent, ObstacleSnapshot, Vec2 } from './types';

const STATE_COLOR: Record<PedestrianAgent['state'], THREE.Color> = {
  idle: new THREE.Color('#9aa0a6'), walking: new THREE.Color('#65d68a'), turning: new THREE.Color('#ffd166'),
  talking: new THREE.Color('#70b7ff'), celebrating: new THREE.Color('#ff7a59'),
};

/** Optional scene overlay for routes, state markers, and collision footprints. */
export class PedestrianDebugOverlay {
  readonly root = new THREE.Group();
  private readonly routeGeometry = new THREE.BufferGeometry();
  private readonly stateGeometry = new THREE.BufferGeometry();
  private readonly collisionGeometry = new THREE.BufferGeometry();
  private readonly routeLines = new THREE.LineSegments(this.routeGeometry, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: .72 }));
  private readonly statePoints = new THREE.Points(this.stateGeometry, new THREE.PointsMaterial({ size: 1.25, vertexColors: true, sizeAttenuation: true }));
  private readonly collisionLines = new THREE.LineSegments(this.collisionGeometry, new THREE.LineBasicMaterial({ color: '#ff5252', transparent: true, opacity: .8 }));
  private refreshTimer = 0;

  constructor(scene: THREE.Scene) { this.root.name = 'pedestrian-debug-overlay'; this.root.add(this.routeLines, this.statePoints, this.collisionLines); scene.add(this.root); this.root.visible = false; }

  update(agents: Iterable<PedestrianAgent>, obstacles: ObstacleSnapshot, camera: Vec2, delta: number, enabled: boolean): void {
    this.root.visible = enabled; if (!enabled) return;
    this.refreshTimer += delta; if (this.refreshTimer < .18) return; this.refreshTimer = 0;
    const routePositions: number[] = [], routeColors: number[] = [], statePositions: number[] = [], stateColors: number[] = [];
    for (const agent of agents) {
      if (agent.lod === 'culled' || Math.hypot(agent.position.x - camera.x, agent.position.z - camera.z) > 190) continue;
      const color = STATE_COLOR[agent.state];
      statePositions.push(agent.position.x, .16, agent.position.z); stateColors.push(color.r, color.g, color.b);
      for (let i = Math.max(0, agent.routeIndex - 1); i < agent.route.length - 1; i++) {
        const a = agent.route[i], b = agent.route[i + 1];
        routePositions.push(a.x, .12, a.z, b.x, .12, b.z); routeColors.push(.2, .8, 1, .2, .8, 1);
      }
    }
    this.setGeometry(this.routeGeometry, routePositions, routeColors);
    this.setGeometry(this.stateGeometry, statePositions, stateColors);
    const collisionPositions: number[] = [];
    for (const box of [...obstacles.buildings, ...(obstacles.static ?? [])]) {
      const cx = (box.minX + box.maxX) / 2, cz = (box.minZ + box.maxZ) / 2;
      if (Math.hypot(cx - camera.x, cz - camera.z) > 90) continue;
      const y = .1, x0 = box.minX, x1 = box.maxX, z0 = box.minZ, z1 = box.maxZ;
      collisionPositions.push(x0,y,z0,x1,y,z0, x1,y,z0,x1,y,z1, x1,y,z1,x0,y,z1, x0,y,z1,x0,y,z0);
    }
    for (const vehicle of obstacles.vehicles) {
      const r = vehicle.radius, x = vehicle.x, z = vehicle.z, y = .2;
      for (let i = 0; i < 12; i++) {
        const a = i / 12 * Math.PI * 2, b = (i + 1) / 12 * Math.PI * 2;
        collisionPositions.push(x + Math.cos(a) * r,y,z + Math.sin(a) * r, x + Math.cos(b) * r,y,z + Math.sin(b) * r);
      }
    }
    this.setGeometry(this.collisionGeometry, collisionPositions);
  }

  private setGeometry(geometry: THREE.BufferGeometry, positions: number[], colors?: number[]): void {
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    if (colors) geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.computeBoundingSphere();
  }
  dispose(): void {
    this.root.parent?.remove(this.root); this.routeGeometry.dispose(); this.stateGeometry.dispose(); this.collisionGeometry.dispose();
    (this.routeLines.material as THREE.Material).dispose(); (this.statePoints.material as THREE.Material).dispose(); (this.collisionLines.material as THREE.Material).dispose();
  }
}
