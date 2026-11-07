import { describe, expect, it } from 'vitest';
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
