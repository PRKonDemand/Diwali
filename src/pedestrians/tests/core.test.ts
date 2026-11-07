import { describe, expect, it } from 'vitest';
import { AgentSpatialHash, ObstacleSpatialHash } from '../avoidance';
import { SeededRandom } from '../behaviour';
import { PedestrianNavigator } from '../navigation';
import { PedestrianStateMachine } from '../state-machine';
import type { PedestrianAgent } from '../types';

const graph = {
  nodes: [{ id: 'a', x: 0, z: 0 }, { id: 'b', x: 10, z: 0 }, { id: 'c', x: 10, z: 10 }, { id: 'd', x: 20, z: 10 }],
  edges: [{ from: 'a', to: 'b' }, { from: 'b', to: 'c' }, { from: 'c', to: 'd' }],
};

describe('Pedestrian navigation', () => {
  it('finds a connected route and preserves intermediate waypoints', () => {
    const route = new PedestrianNavigator(graph).findRoute({ x: 0, z: 0 }, { x: 20, z: 10 });
    expect(route?.nodeIds).toEqual(['a', 'b', 'c', 'd']); expect(route?.points).toHaveLength(4);
  });
  it('returns null for disconnected destinations', () => {
    const nav = new PedestrianNavigator({ nodes: [...graph.nodes, { id: 'isolated', x: 80, z: 80 }], edges: graph.edges });
    expect(nav.findRoute({ x: 0, z: 0 }, { x: 80, z: 80 })).toBeNull();
  });
});

describe('Pedestrian state machine', () => {
  it('allows an idle pedestrian to walk after its pause expires', () => {
    const agent = { state: 'idle', stateTime: 0, stateDuration: 1 } as PedestrianAgent;
    const machine = new PedestrianStateMachine();
    expect(machine.tick(agent, 1.1)).toBe(true); expect(machine.enter(agent, 'walking')).toBe(true);
    expect(agent.state).toBe('walking');
  });
});

describe('Deterministic variation', () => {
  it('produces repeatable random sequences', () => {
    const a = new SeededRandom(77), b = new SeededRandom(77), c = new SeededRandom(78);
    expect([a.next(), a.next(), a.next()]).toEqual([b.next(), b.next(), b.next()]);
    expect(new SeededRandom(77).next()).not.toBe(c.next());
  });
});

describe('Crowd and obstacle broad phase', () => {
  it('keeps nearby queries bounded in a 500-agent crowd', () => {
    const crowd = Array.from({ length: 500 }, (_, i) => ({
      id: String(i), position: { x: i % 25, z: Math.floor(i / 25) }, lod: 'near',
    } as PedestrianAgent));
    const hash = new AgentSpatialHash(6);
    hash.rebuild(crowd);
    const nearby = hash.query({ x: 0, z: 0 }, 3);
    expect(nearby.length).toBeGreaterThan(0);
    expect(nearby.length).toBeLessThan(500);
  });
  it('returns only static obstacle candidates in the queried area', () => {
    const hash = new ObstacleSpatialHash(24, [
      { id: 'near', kind: 'building', minX: 10, maxX: 20, minZ: 10, maxZ: 20 },
      { id: 'far', kind: 'building', minX: 500, maxX: 520, minZ: 500, maxZ: 520 },
    ]);
    expect(hash.query({ x: 12, z: 12 }, 2).map(item => item.id)).toContain('near');
    expect(hash.query({ x: 12, z: 12 }, 2).map(item => item.id)).not.toContain('far');
  });
});
