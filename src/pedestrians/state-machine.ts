import type { PedestrianAgent, PedestrianState } from './types';

const ALLOWED: Record<PedestrianState, PedestrianState[]> = {
  idle: ['walking', 'turning', 'talking', 'celebrating'],
  walking: ['idle', 'turning', 'talking', 'celebrating'],
  turning: ['walking', 'idle'],
  talking: ['walking', 'idle'],
  celebrating: ['walking', 'idle'],
};

/** Explicit state transitions keep AI decisions independent from animation code. */
export class PedestrianStateMachine {
  enter(agent: PedestrianAgent, next: PedestrianState, duration = 0): boolean {
    if (agent.state !== next && !ALLOWED[agent.state].includes(next)) return false;
    agent.state = next; agent.stateTime = 0; agent.stateDuration = Math.max(0, duration);
    return true;
  }
  tick(agent: PedestrianAgent, delta: number): boolean {
    agent.stateTime += delta;
    return agent.stateDuration > 0 && agent.stateTime >= agent.stateDuration && agent.state !== 'walking';
  }
}
