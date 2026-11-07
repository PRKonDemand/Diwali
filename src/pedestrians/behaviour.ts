import type { BehaviourProfile, DestinationPoint, PedestrianAgent, PedestrianAppearance, PedestrianCategory, PedestrianState, Vec2 } from './types';

export const DEFAULT_PROFILES: BehaviourProfile[] = [
  { id: 'resident', categories: ['resident'], clothing: ['casual', 'traditional'], minSpeed: 1, maxSpeed: 1.55, pauseChance: .18, minPause: 1.2, maxPause: 4.2, destinationTags: ['home', 'shop', 'park', 'food'], talkChance: .08, celebrationChance: .05, groupRadius: 3.2 },
  { id: 'visitor', categories: ['visitor'], clothing: ['casual', 'festive'], minSpeed: .85, maxSpeed: 1.4, pauseChance: .32, minPause: 2, maxPause: 7, destinationTags: ['landmark', 'market', 'temple', 'festival', 'food'], talkChance: .16, celebrationChance: .12, groupRadius: 4.5 },
  { id: 'shopkeeper', categories: ['shopkeeper'], clothing: ['workwear', 'traditional'], minSpeed: .65, maxSpeed: 1.05, pauseChance: .48, minPause: 3, maxPause: 9, destinationTags: ['shop', 'food', 'market'], talkChance: .3, celebrationChance: .04, groupRadius: 2.5 },
  { id: 'devotee', categories: ['devotee'], clothing: ['traditional', 'festive'], minSpeed: .72, maxSpeed: 1.25, pauseChance: .28, minPause: 2, maxPause: 6, destinationTags: ['temple', 'plaza', 'landmark'], talkChance: .12, celebrationChance: .24, groupRadius: 4 },
  { id: 'family', categories: ['family', 'child', 'elder'], clothing: ['traditional', 'festive', 'casual'], minSpeed: .7, maxSpeed: 1.2, pauseChance: .24, minPause: 1.5, maxPause: 5, destinationTags: ['park', 'food', 'festival', 'temple'], talkChance: .2, celebrationChance: .18, groupRadius: 5.5 },
  { id: 'performer', categories: ['performer'], clothing: ['festive', 'traditional'], minSpeed: .6, maxSpeed: 1.1, pauseChance: .2, minPause: 2, maxPause: 5, destinationTags: ['festival', 'plaza', 'stage'], talkChance: .08, celebrationChance: .7, groupRadius: 3 },
];

const SKIN = ['#8d573c', '#a96d4d', '#c18460', '#70442f', '#d19a72'];
const FESTIVE = ['#d94c43', '#e6ad32', '#247b61', '#6d4ca0', '#e17c36', '#2d7890'];
const CASUAL = ['#526b86', '#6e8060', '#a65e4e', '#8b7396', '#b08b54', '#477d83'];
const HAIR = ['#171411', '#2a211c', '#49382b'];

export class SeededRandom {
  private state: number;
  constructor(seed: number) { this.state = seed >>> 0 || 1; }
  next(): number {
    let t = this.state += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
  range(min: number, max: number): number { return min + (max - min) * this.next(); }
  pick<T>(items: readonly T[]): T { return items[Math.floor(this.next() * items.length)] ?? items[0]; }
}

export function makeAppearance(rng: SeededRandom, category: PedestrianCategory, clothing: BehaviourProfile['clothing']): PedestrianAppearance {
  const style = rng.pick(clothing);
  return {
    category, clothing: style, skinTone: rng.pick(SKIN),
    clothingColor: rng.pick(style === 'festive' || style === 'traditional' ? FESTIVE : CASUAL),
    accentColor: rng.pick(FESTIVE),
    height: rng.range(category === 'child' ? 1.05 : category === 'elder' ? 1.52 : 1.58, category === 'child' ? 1.3 : category === 'elder' ? 1.7 : 1.92),
    bodyScale: rng.range(.9, 1.12), hairColor: rng.pick(HAIR),
  };
}

export function chooseDestination(rng: SeededRandom, destinations: DestinationPoint[], profile: BehaviourProfile, districtId: string, current?: Vec2): DestinationPoint | undefined {
  const candidates = destinations.filter(d => profile.destinationTags.some(tag => d.tags.includes(tag)) && (!profile.preferredDistricts?.length || profile.preferredDistricts.includes(d.districtId)));
  const pool = candidates.length ? candidates : destinations;
  if (!pool.length) return undefined;
  const weighted = pool.map(d => ({
    d, w: Math.max(.1, d.weight ?? 1) * (d.districtId === districtId ? .85 : 1) *
      (current ? Math.max(.2, Math.min(1.8, Math.hypot(d.x - current.x, d.z - current.z) / 90)) : 1),
  }));
  const total = weighted.reduce((sum, item) => sum + item.w, 0);
  let roll = rng.next() * total;
  for (const item of weighted) { roll -= item.w; if (roll <= 0) return item.d; }
  return weighted[weighted.length - 1].d;
}

export function nextAmbientState(agent: PedestrianAgent, rng: SeededRandom): { state: PedestrianState; duration: number } {
  const roll = rng.next();
  if (roll < agent.profile.talkChance) return { state: 'talking', duration: rng.range(2.5, 6) };
  if (roll < agent.profile.talkChance + agent.profile.celebrationChance) return { state: 'celebrating', duration: rng.range(2, 5) };
  return { state: 'idle', duration: rng.range(agent.profile.minPause, agent.profile.maxPause) };
}
