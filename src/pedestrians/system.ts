import type { Scene } from 'three';
import { AgentSpatialHash, ObstacleSpatialHash, calculateAvoidance } from './avoidance';
import { DEFAULT_PROFILES, SeededRandom, chooseDestination, makeAppearance, nextAmbientState } from './behaviour';
import { PedestrianNavigator } from './navigation';
import { PedestrianRenderer } from './renderer';
import { PedestrianStateMachine } from './state-machine';
import type { BehaviourProfile, CircleObstacle, PedestrianAgent, PedestrianConfig, PedestrianDebugSnapshot, PedestrianGroup, PedestrianSpawn, PedestrianWorldAdapter, Vec2 } from './types';
import { DEFAULT_PEDESTRIAN_CONFIG } from './types';

const distance = (a: Vec2, b: Vec2) => Math.hypot(a.x - b.x, a.z - b.z);
const angleDelta = (a: number, b: number) => Math.atan2(Math.sin(b - a), Math.cos(b - a));

/** Orchestrates simulation. All AI state is data-only; the renderer is a separate adapter. */
export class PedestrianSystem {
  readonly agents = new Map<string, PedestrianAgent>();
  readonly groups = new Map<string, PedestrianGroup>();
  private readonly navigator: PedestrianNavigator;
  private readonly renderer: PedestrianRenderer;
  private readonly stateMachine = new PedestrianStateMachine();
  private readonly rng: SeededRandom;
  private readonly spatial = new AgentSpatialHash(6);
  private readonly staticObstacles: ObstacleSpatialHash;
  private readonly profiles: BehaviourProfile[];
  private elapsed = 0;
  private blockedRoutes = 0;
  private readonly config: PedestrianConfig;
  private readonly world: PedestrianWorldAdapter;

  constructor(scene: Scene, world: PedestrianWorldAdapter, config: Partial<PedestrianConfig> = {}, profiles: BehaviourProfile[] = DEFAULT_PROFILES) {
    this.config = { ...DEFAULT_PEDESTRIAN_CONFIG, ...config };
    this.world = world; this.profiles = profiles; this.rng = new SeededRandom(this.config.seed);
    this.navigator = new PedestrianNavigator(world.navigation);
    this.staticObstacles = new ObstacleSpatialHash(24, [...world.obstacles.buildings, ...(world.obstacles.static ?? [])]);
    this.renderer = new PedestrianRenderer(scene, this.config.maxAgents);
  }

  spawnPopulation(count = this.config.spawnCount): void {
    const total = Math.min(count, this.config.maxAgents - this.agents.size);
    let created = 0;
    while (created < total) {
      if (created + 3 <= total && this.rng.next() < .22) created += this.spawnGroup('family', 3 + Math.floor(this.rng.next() * 2));
      else {
        const node = this.randomNode(); if (!node) break;
        this.spawn({ position: node, districtId: this.world.districtAt(node) }); created++;
      }
    }
  }

  spawnGroup(kind: PedestrianGroup['kind'], size: number, center?: Vec2, districtId?: string): number {
    const room = this.config.maxAgents - this.agents.size; size = Math.max(1, Math.min(size, room));
    if (!size) return 0;
    const origin = center ?? this.randomNode(); if (!origin) return 0;
    const district = districtId ?? this.world.districtAt(origin);
    const id = `group-${Math.floor(this.rng.next() * 1e9).toString(36)}`;
    const memberIds: string[] = [];
    for (let i = 0; i < size; i++) {
      const angle = i * 2.4 + this.rng.range(-.3, .3), radius = i === 0 ? 0 : 1.1 + i * .22;
      const position = { x: origin.x + Math.cos(angle) * radius, z: origin.z + Math.sin(angle) * radius };
      const profileId = kind === 'family' ? 'family' : this.rng.pick(['resident', 'visitor']);
      const category = kind === 'family' ? (i === 0 ? 'family' : i === 1 ? 'child' : i === 2 ? 'elder' : 'family') : undefined;
      const agent = this.spawn({ position, districtId: district, profileId, category, groupId: id });
      if (agent) memberIds.push(agent.id);
    }
    if (!memberIds.length) return 0;
    const leaderId = memberIds[0];
    for (const memberId of memberIds.slice(1)) this.agents.get(memberId)!.leaderId = leaderId;
    this.groups.set(id, { id, kind, memberIds, leaderId, cohesion: kind === 'family' ? .72 : .42 });
    return memberIds.length;
  }

  spawn(input: PedestrianSpawn): PedestrianAgent | undefined {
    if (this.agents.size >= this.config.maxAgents) return undefined;
    const profile = this.profiles.find(p => p.id === input.profileId) ?? this.profileForCategory(input.category) ?? this.rng.pick(this.profiles);
    const id = input.id ?? `ped-${Math.floor(this.rng.next() * 0x7fffffff).toString(36)}`;
    if (this.agents.has(id)) return undefined;
    const category = input.category ?? this.rng.pick(profile.categories);
    const localRng = new SeededRandom(Math.floor(this.rng.next() * 0xffffffff));
    const agent: PedestrianAgent = {
      id, position: { ...input.position }, previousPosition: { ...input.position }, velocity: { x: 0, z: 0 },
      heading: localRng.range(-Math.PI, Math.PI), desiredHeading: 0, speed: 0,
      targetSpeed: localRng.range(profile.minSpeed, profile.maxSpeed), districtId: input.districtId,
      route: [], routeIndex: 0, state: 'idle', stateTime: 0, stateDuration: localRng.range(.2, 1.8), pauseTimer: 0,
      profile, appearance: makeAppearance(localRng, category, profile.clothing), groupId: input.groupId,
      randomSeed: Math.floor(localRng.next() * 0xffffffff), animationPhase: localRng.range(0, Math.PI * 2),
      lod: 'near', lastUpdate: 0,
    };
    this.agents.set(id, agent); this.assignDestination(agent, localRng); this.renderer.add(agent);
    return agent;
  }

  private profileForCategory(category?: PedestrianSpawn['category']): BehaviourProfile | undefined {
    return category ? this.profiles.find(profile => profile.categories.includes(category)) : undefined;
  }
  private randomNode(): Vec2 | undefined {
    const nodes = this.world.navigation.nodes; if (!nodes.length) return undefined;
    const node = nodes[Math.floor(this.rng.next() * nodes.length)];
    return { x: node.x + this.rng.range(-1.2, 1.2), z: node.z + this.rng.range(-1.2, 1.2) };
  }
  private assignDestination(agent: PedestrianAgent, rng: SeededRandom): void {
    const destination = chooseDestination(rng, this.world.destinations, agent.profile, agent.districtId, agent.position);
    const target: Vec2 | undefined = destination ?? this.randomNode();
    if (!target) { agent.route = []; return; }
    const route = this.navigator.findRoute(agent.position, target, agent.districtId);
    if (!route || route.points.length < 2) { agent.route = []; agent.destinationId = undefined; return; }
    agent.destinationId = destination?.id; agent.route = route.points; agent.routeIndex = 1;
    agent.targetSpeed = rng.range(agent.profile.minSpeed, agent.profile.maxSpeed);
  }

  update(deltaSeconds: number, cameraPosition: Vec2, vehicles = this.world.obstacles.vehicles): void {
    const delta = Math.min(.05, Math.max(0, deltaSeconds)); if (!delta) return;
    this.elapsed += delta; this.spatial.rebuild(this.agents.values());
    const activeVehicles = [...vehicles, ...(this.world.obstacles.temporary ?? [])];
    for (const agent of this.agents.values()) {
      const d = distance(agent.position, cameraPosition);
      const nextLod = d <= this.config.nearDistance ? 'near' : d <= this.config.midDistance ? 'mid' : d <= this.config.farDistance ? 'far' : 'culled';
      if (nextLod !== agent.lod) { agent.lod = nextLod; this.renderer.markFarDirty(); }
      if (nextLod === 'culled') { this.renderer.update(agent, this.elapsed, delta); continue; }
      const interval = nextLod === 'near' ? this.config.updateIntervalNear : nextLod === 'mid' ? this.config.updateIntervalMid : this.config.updateIntervalFar;
      if (interval > 0 && this.elapsed - agent.lastUpdate < interval) continue;
      const step = Math.min(.12, this.elapsed - agent.lastUpdate || delta); agent.lastUpdate = this.elapsed;
      this.updateAgent(agent, step, activeVehicles);
    }
    this.renderer.updateFarInstances();
  }

  private updateAgent(agent: PedestrianAgent, delta: number, vehicles: CircleObstacle[]): void {
    const rng = new SeededRandom(agent.randomSeed + Math.floor(this.elapsed * 1000));
    if (this.stateMachine.tick(agent, delta)) {
      if (agent.state === 'talking' || agent.state === 'celebrating' || agent.state === 'idle') this.stateMachine.enter(agent, 'walking');
    }
    if (agent.leaderId) {
      const leader = this.agents.get(agent.leaderId);
      if (leader) {
        const trailing = { x: leader.position.x - Math.sin(leader.heading) * 1.7, z: leader.position.z - Math.cos(leader.heading) * 1.7 };
        if (distance(agent.position, trailing) > 1.8 && agent.state !== 'talking' && agent.state !== 'celebrating') this.stateMachine.enter(agent, 'walking');
      }
    }
    if (agent.state === 'idle' || agent.state === 'talking' || agent.state === 'celebrating') {
      agent.speed = Math.max(0, agent.speed - delta * 2.8);
      this.renderer.update(agent, this.elapsed, delta); return;
    }

    let target: Vec2 | undefined;
    if (agent.leaderId) {
      const leader = this.agents.get(agent.leaderId);
      if (leader) target = { x: leader.position.x - Math.sin(leader.heading) * 1.6, z: leader.position.z - Math.cos(leader.heading) * 1.6 };
    }
    if (!target) target = agent.route[agent.routeIndex];
    if (!target) {
      const ambient = nextAmbientState(agent, rng);
      if (ambient.state !== 'idle' || rng.next() < agent.profile.pauseChance) this.stateMachine.enter(agent, ambient.state, ambient.duration);
      else this.assignDestination(agent, rng);
      this.renderer.update(agent, this.elapsed, delta); return;
    }

    if (distance(agent.position, target) <= this.config.waypointRadius) {
      if (!agent.leaderId) agent.routeIndex++;
      if (!agent.leaderId && agent.routeIndex >= agent.route.length) {
        const ambient = nextAmbientState(agent, rng);
        if (ambient.state !== 'idle' || rng.next() < agent.profile.pauseChance) this.stateMachine.enter(agent, ambient.state, ambient.duration);
        else this.assignDestination(agent, rng);
        this.renderer.update(agent, this.elapsed, delta); return;
      }
      target = agent.leaderId ? target : agent.route[agent.routeIndex];
      if (!target) { this.assignDestination(agent, rng); return; }
    }

    const desired = { x: target.x - agent.position.x, z: target.z - agent.position.z };
    const desiredLength = Math.hypot(desired.x, desired.z) || 1; desired.x /= desiredLength; desired.z /= desiredLength;
    const nearby = this.spatial.query(agent.position, this.config.avoidanceRadius * 1.7);
    const buildings = this.staticObstacles.query(agent.position, this.config.avoidanceRadius + 2);
    const avoidance = calculateAvoidance(agent, desired, nearby, buildings, vehicles, this.config.avoidanceRadius, this.config.separationWeight, this.config.obstacleWeight);
    if (avoidance.blocked) this.blockedRoutes++;
    agent.desiredHeading = Math.atan2(avoidance.direction.x, avoidance.direction.z);
    const turn = angleDelta(agent.heading, agent.desiredHeading), maxTurn = delta * (agent.state === 'turning' ? 2.2 : 3.8);
    if (Math.abs(turn) > .48) {
      this.stateMachine.enter(agent, 'turning');
      agent.heading += Math.sign(turn) * Math.min(Math.abs(turn), maxTurn);
    } else {
      if (agent.state === 'turning') this.stateMachine.enter(agent, 'walking');
      agent.heading += turn * Math.min(1, delta * 5.5);
    }
    const acceleration = agent.state === 'turning' ? 1.1 : 2.4;
    agent.speed += (agent.targetSpeed - agent.speed) * Math.min(1, delta * acceleration);
    const moveScale = agent.state === 'turning' ? .48 : 1;
    agent.previousPosition = { ...agent.position };
    agent.velocity = { x: avoidance.direction.x * agent.speed * moveScale, z: avoidance.direction.z * agent.speed * moveScale };
    const next = { x: agent.position.x + agent.velocity.x * delta, z: agent.position.z + agent.velocity.z * delta };
    const hitBuilding = this.staticObstacles.query(next, .45).some(box =>
      next.x >= box.minX - .3 && next.x <= box.maxX + .3 && next.z >= box.minZ - .3 && next.z <= box.maxZ + .3);
    const hitVehicle = vehicles.some(vehicle => Math.hypot(next.x - vehicle.x, next.z - vehicle.z) < vehicle.radius + .45);
    const hitPedestrian = nearby.some(other => other.id !== agent.id && Math.hypot(next.x - other.position.x, next.z - other.position.z) < .52);
    if (!hitBuilding && !hitVehicle && !hitPedestrian) {
      agent.position = next; agent.districtId = this.world.districtAt(next);
      if (agent.lod === 'far') this.renderer.markFarDirty();
    } else { agent.speed *= .25; agent.velocity = { x: 0, z: 0 }; }
    this.renderer.update(agent, this.elapsed, delta);
  }

  getDebugSnapshot(): PedestrianDebugSnapshot {
    const byState = { idle: 0, walking: 0, turning: 0, talking: 0, celebrating: 0 };
    const byLod = { near: 0, mid: 0, far: 0, culled: 0 }; let speed = 0;
    for (const agent of this.agents.values()) { byState[agent.state]++; byLod[agent.lod]++; speed += agent.speed; }
    return { total: this.agents.size, byState, byLod, blockedRoutes: this.blockedRoutes, averageSpeed: this.agents.size ? speed / this.agents.size : 0 };
  }
  getNavigator(): PedestrianNavigator { return this.navigator; }
  getConfig(): Readonly<PedestrianConfig> { return this.config; }
  remove(id: string): void { const agent = this.agents.get(id); if (!agent) return; this.renderer.remove(agent); this.agents.delete(id); }
  clear(): void { for (const agent of this.agents.values()) this.renderer.remove(agent); this.agents.clear(); this.groups.clear(); }
  dispose(): void { this.clear(); this.renderer.dispose(); }
}
