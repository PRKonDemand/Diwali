import type { Group, Object3D } from 'three';

export interface Vec2 { x: number; z: number }
export type PedestrianState = 'idle' | 'walking' | 'turning' | 'talking' | 'celebrating';
export type PedestrianCategory = 'resident' | 'visitor' | 'shopkeeper' | 'family' | 'devotee' | 'performer' | 'child' | 'elder';
export type ClothingStyle = 'casual' | 'traditional' | 'festive' | 'workwear' | 'school';
export type DistrictId = string;

export interface NavigationNode extends Vec2 { id: string; districtId?: DistrictId; tags?: string[] }
export interface NavigationEdge { from: string; to: string; cost?: number; width?: number; level?: 'arterial' | 'secondary' | 'residential' | 'path' }
export interface NavigationGraphInput { nodes: NavigationNode[]; edges: NavigationEdge[] }
export interface NavigationRoute { nodeIds: string[]; points: Vec2[]; length: number }

export interface AabbObstacle { id: string; kind: 'building' | 'prop' | 'barrier'; minX: number; maxX: number; minZ: number; maxZ: number }
export interface CircleObstacle { id: string; kind: 'vehicle' | 'temporary'; x: number; z: number; radius: number; velocity?: Vec2 }
export interface ObstacleSnapshot { buildings: AabbObstacle[]; vehicles: CircleObstacle[]; static?: AabbObstacle[]; temporary?: CircleObstacle[] }

export interface BehaviourProfile {
  id: string; categories: PedestrianCategory[]; clothing: ClothingStyle[];
  minSpeed: number; maxSpeed: number; pauseChance: number; minPause: number; maxPause: number;
  destinationTags: string[]; talkChance: number; celebrationChance: number; groupRadius: number;
  preferredDistricts?: DistrictId[];
}
export interface PedestrianAppearance {
  category: PedestrianCategory; clothing: ClothingStyle; skinTone: string; clothingColor: string;
  accentColor: string; height: number; bodyScale: number; hairColor: string;
}
export interface DestinationPoint extends Vec2 { id: string; districtId: DistrictId; tags: string[]; weight?: number }
export interface PedestrianSpawn { id?: string; position: Vec2; districtId: DistrictId; category?: PedestrianCategory; profileId?: string; groupId?: string }
export interface PedestrianGroup { id: string; kind: 'family' | 'friends' | 'crowd'; memberIds: string[]; leaderId: string; cohesion: number }

export interface PedestrianConfig {
  maxAgents: number; spawnCount: number; nearDistance: number; midDistance: number; farDistance: number;
  updateIntervalNear: number; updateIntervalMid: number; updateIntervalFar: number;
  avoidanceRadius: number; separationWeight: number; obstacleWeight: number; waypointRadius: number;
  seed: number; debug: boolean;
}
export interface PedestrianAgent {
  id: string; position: Vec2; previousPosition: Vec2; velocity: Vec2; heading: number; desiredHeading: number;
  speed: number; targetSpeed: number; districtId: DistrictId; destinationId?: string; route: Vec2[]; routeIndex: number;
  state: PedestrianState; stateTime: number; stateDuration: number; pauseTimer: number;
  profile: BehaviourProfile; appearance: PedestrianAppearance; groupId?: string; leaderId?: string;
  randomSeed: number; animationPhase: number; lod: 'near' | 'mid' | 'far' | 'culled';
  renderObject?: Group; animationRoot?: Object3D; lastUpdate: number;
}
export interface PedestrianDebugSnapshot {
  total: number; byState: Record<PedestrianState, number>; byLod: Record<PedestrianAgent['lod'], number>;
  blockedRoutes: number; averageSpeed: number;
}
export interface PedestrianWorldAdapter {
  navigation: NavigationGraphInput; destinations: DestinationPoint[]; obstacles: ObstacleSnapshot;
  districtAt(position: Vec2): DistrictId;
}

export const DEFAULT_PEDESTRIAN_CONFIG: PedestrianConfig = {
  maxAgents: 420, spawnCount: 150, nearDistance: 55, midDistance: 145, farDistance: 270,
  updateIntervalNear: 0, updateIntervalMid: 0.12, updateIntervalFar: 0.4,
  avoidanceRadius: 2.4, separationWeight: 1.65, obstacleWeight: 2.2, waypointRadius: 2.2,
  seed: 20261107, debug: false,
};
