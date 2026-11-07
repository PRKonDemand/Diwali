import type { NavigationEdge, NavigationGraphInput, NavigationRoute, Vec2 } from './types';

interface Link { to: string; cost: number }
const distance = (a: Vec2, b: Vec2): number => Math.hypot(a.x - b.x, a.z - b.z);

/** A* over the city's stitched walkable road/path graph. */
export class PedestrianNavigator {
  private readonly nodes = new Map<string, NavigationGraphInput['nodes'][number]>();
  private readonly links = new Map<string, Link[]>();

  constructor(input: NavigationGraphInput) {
    for (const node of input.nodes) { this.nodes.set(node.id, node); this.links.set(node.id, []); }
    for (const edge of input.edges) this.addEdge(edge);
  }
  private addEdge(edge: NavigationEdge): void {
    const a = this.nodes.get(edge.from), b = this.nodes.get(edge.to);
    if (!a || !b) return;
    const cost = Math.max(0.01, edge.cost ?? distance(a, b));
    this.links.get(edge.from)!.push({ to: edge.to, cost });
    this.links.get(edge.to)!.push({ to: edge.from, cost });
  }
  nearestNode(position: Vec2, districtId?: string): string | undefined {
    let best: string | undefined, bestScore = Infinity;
    for (const node of this.nodes.values()) {
      const d = distance(position, node);
      const score = d + (districtId && node.districtId && node.districtId !== districtId ? 18 : 0);
      if (score < bestScore) { bestScore = score; best = node.id; }
    }
    return best;
  }
  findRoute(start: Vec2, end: Vec2, districtId?: string): NavigationRoute | null {
    const startId = this.nearestNode(start, districtId), endId = this.nearestNode(end);
    if (!startId || !endId) return null;
    const open = new Set<string>([startId]), cameFrom = new Map<string, string>();
    const g = new Map<string, number>([[startId, 0]]);
    const f = new Map<string, number>([[startId, distance(this.nodes.get(startId)!, this.nodes.get(endId)!)]]);
    while (open.size) {
      let current: string | undefined, lowest = Infinity;
      for (const id of open) { const score = f.get(id) ?? Infinity; if (score < lowest) { lowest = score; current = id; } }
      if (!current) break;
      if (current === endId) return this.buildRoute(cameFrom, current, start, end);
      open.delete(current);
      for (const link of this.links.get(current) ?? []) {
        const tentative = (g.get(current) ?? Infinity) + link.cost;
        if (tentative >= (g.get(link.to) ?? Infinity)) continue;
        cameFrom.set(link.to, current); g.set(link.to, tentative);
        f.set(link.to, tentative + distance(this.nodes.get(link.to)!, this.nodes.get(endId)!));
        open.add(link.to);
      }
    }
    return null;
  }
  private buildRoute(cameFrom: Map<string, string>, current: string, start: Vec2, end: Vec2): NavigationRoute {
    const ids = [current];
    while (cameFrom.has(current)) { current = cameFrom.get(current)!; ids.unshift(current); }
    const points: Vec2[] = [start, ...ids.slice(1, -1).map(id => this.nodes.get(id)!), end];
    let length = 0;
    for (let i = 1; i < points.length; i++) length += distance(points[i - 1], points[i]);
    return { nodeIds: ids, points, length };
  }
  hasNode(id: string): boolean { return this.nodes.has(id); }
  getNode(id: string) { return this.nodes.get(id); }
  getNodeCount(): number { return this.nodes.size; }
}
export function isRouteValid(route: NavigationRoute, navigator: PedestrianNavigator): boolean {
  return route.nodeIds.length > 0 && route.nodeIds.every(id => navigator.hasNode(id)) && route.points.length >= 2;
}
