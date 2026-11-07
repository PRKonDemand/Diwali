import * as THREE from 'three';
import type { PedestrianAgent, PedestrianState } from './types';

const STATE_SWAY: Record<PedestrianState, number> = { idle: .035, walking: .18, turning: .08, talking: .1, celebrating: .42 };

/** Rendering only: no pathfinding, destination choice, or simulation decisions live here. */
export class PedestrianRenderer {
  private readonly scene: THREE.Scene;
  private readonly geometry = {
    torso: new THREE.CapsuleGeometry(.22, .48, 3, 6),
    head: new THREE.SphereGeometry(.145, 8, 6),
    limb: new THREE.CylinderGeometry(.055, .07, .48, 6),
    foot: new THREE.BoxGeometry(.13, .08, .23),
    accent: new THREE.BoxGeometry(.08, .28, .025),
    farBody: new THREE.BoxGeometry(.34, 1.15, .22),
    farHead: new THREE.SphereGeometry(.12, 6, 5),
  };
  private readonly materialCache = new Map<string, THREE.MeshStandardMaterial>();
  private readonly agents = new Map<string, PedestrianAgent>();
  private readonly farBodies = new Map<string, THREE.InstancedMesh>();
  private readonly farHeads = new Map<string, THREE.InstancedMesh>();
  private readonly dummy = new THREE.Object3D();
  private farDirty = true;
  private readonly maxAgents: number;

  constructor(scene: THREE.Scene, maxAgents: number) { this.scene = scene; this.maxAgents = maxAgents; }

  private material(color: string, roughness = .82): THREE.MeshStandardMaterial {
    const key = `${color}:${roughness}`;
    let material = this.materialCache.get(key);
    if (!material) { material = new THREE.MeshStandardMaterial({ color, roughness }); this.materialCache.set(key, material); }
    return material;
  }

  add(agent: PedestrianAgent): void {
    const root = new THREE.Group(); root.name = `pedestrian:${agent.id}`;
    const body = new THREE.Group(); body.position.y = .82; root.add(body);
    const torso = new THREE.Mesh(this.geometry.torso, this.material(agent.appearance.clothingColor));
    torso.scale.set(agent.appearance.bodyScale, 1, .78); body.add(torso);
    const headPivot = new THREE.Group(); headPivot.position.set(0, .42, 0); body.add(headPivot);
    const head = new THREE.Mesh(this.geometry.head, this.material(agent.appearance.skinTone)); head.scale.set(.92, 1, .9); headPivot.add(head);
    const hair = new THREE.Mesh(this.geometry.head, this.material(agent.appearance.hairColor)); hair.scale.set(.96, .42, .94); hair.position.y = .075; headPivot.add(hair);
    const arms: THREE.Group[] = [], legs: THREE.Group[] = [];
    for (const side of [-1, 1]) {
      const arm = new THREE.Group(); arm.position.set(side * .25, .22, 0); body.add(arm);
      const armMesh = new THREE.Mesh(this.geometry.limb, this.material(agent.appearance.skinTone)); armMesh.position.y = -.2; arm.add(armMesh); arms.push(arm);
      const leg = new THREE.Group(); leg.position.set(side * .105, .48, 0); root.add(leg);
      const legMesh = new THREE.Mesh(this.geometry.limb, this.material(agent.appearance.clothingColor)); legMesh.position.y = -.22; leg.add(legMesh);
      const foot = new THREE.Mesh(this.geometry.foot, this.material('#332a25')); foot.position.set(0, -.46, .055); leg.add(foot); legs.push(leg);
    }
    const accent = new THREE.Mesh(this.geometry.accent, this.material(agent.appearance.accentColor)); accent.position.set(.12, .91, .205); root.add(accent);
    root.scale.setScalar(agent.appearance.height / 1.72);
    this.scene.add(root); agent.renderObject = root; agent.animationRoot = body;
    (agent as PedestrianAgent & { __rig?: unknown }).__rig = { arms, legs, headPivot, body };
    this.agents.set(agent.id, agent); this.farDirty = true;
  }

  remove(agent: PedestrianAgent): void {
    if (agent.renderObject) this.scene.remove(agent.renderObject);
    agent.renderObject = undefined; agent.animationRoot = undefined;
    this.agents.delete(agent.id); this.farDirty = true;
  }

  update(agent: PedestrianAgent, time: number, delta: number): void {
    const root = agent.renderObject; if (!root) return;
    root.position.set(agent.position.x, 0, agent.position.z);
    root.rotation.y = agent.heading;
    root.visible = agent.lod === 'near' || agent.lod === 'mid';
    const rig = (agent as PedestrianAgent & { __rig?: { arms: THREE.Group[]; legs: THREE.Group[]; headPivot: THREE.Group; body: THREE.Group } }).__rig;
    if (!rig) return;
    if (agent.lod === 'mid') {
      for (const limb of [...rig.arms, ...rig.legs]) limb.visible = false;
      rig.headPivot.rotation.y = Math.sin(time * .7 + agent.animationPhase) * .08;
      return;
    }
    for (const limb of [...rig.arms, ...rig.legs]) limb.visible = true;
    const phase = time * (agent.state === 'walking' ? 8 + agent.speed * 1.5 : 1.6) + agent.animationPhase;
    const sway = STATE_SWAY[agent.state];
    const gait = agent.state === 'walking' ? Math.sin(phase) * .62 : Math.sin(phase) * sway;
    rig.legs[0].rotation.x = gait; rig.legs[1].rotation.x = -gait;
    rig.arms[0].rotation.x = -gait * .72; rig.arms[1].rotation.x = gait * .72;
    rig.body.rotation.z = agent.state === 'walking' ? Math.sin(phase * .5) * .035 : Math.sin(phase) * sway * .18;
    rig.headPivot.rotation.y = agent.state === 'talking' ? Math.sin(phase * .7) * .24 : Math.sin(phase * .35) * .045;
    rig.body.rotation.x = agent.state === 'celebrating' ? Math.sin(phase) * .09 : 0;
    if (agent.state === 'celebrating') { rig.arms[0].rotation.z = -.9 + Math.sin(phase) * .16; rig.arms[1].rotation.z = .9 - Math.sin(phase) * .16; }
    else { rig.arms[0].rotation.z = -.08; rig.arms[1].rotation.z = .08; }
    void delta;
  }

  updateFarInstances(): void {
    if (!this.farDirty) return;
    const bodyGroups = new Map<string, PedestrianAgent[]>(), headGroups = new Map<string, PedestrianAgent[]>();
    for (const agent of this.agents.values()) if (agent.lod === 'far') {
      const bodyList = bodyGroups.get(agent.appearance.clothingColor) ?? []; bodyList.push(agent); bodyGroups.set(agent.appearance.clothingColor, bodyList);
      const headList = headGroups.get(agent.appearance.skinTone) ?? []; headList.push(agent); headGroups.set(agent.appearance.skinTone, headList);
    }
    for (const mesh of [...this.farBodies.values(), ...this.farHeads.values()]) { mesh.count = 0; mesh.visible = false; }
    for (const [color, agents] of bodyGroups) {
      let mesh = this.farBodies.get(color);
      if (!mesh) { mesh = new THREE.InstancedMesh(this.geometry.farBody, this.material(color), this.maxAgents); mesh.frustumCulled = false; this.scene.add(mesh); this.farBodies.set(color, mesh); }
      agents.forEach((agent, i) => { this.dummy.position.set(agent.position.x, .68, agent.position.z); this.dummy.rotation.set(0, agent.heading, 0); this.dummy.scale.set(1, agent.appearance.height / 1.72, 1); this.dummy.updateMatrix(); mesh!.setMatrixAt(i, this.dummy.matrix); });
      mesh.count = agents.length; mesh.instanceMatrix.needsUpdate = true; mesh.visible = true;
    }
    for (const [color, agents] of headGroups) {
      let mesh = this.farHeads.get(color);
      if (!mesh) { mesh = new THREE.InstancedMesh(this.geometry.farHead, this.material(color), this.maxAgents); mesh.frustumCulled = false; this.scene.add(mesh); this.farHeads.set(color, mesh); }
      agents.forEach((agent, i) => { this.dummy.position.set(agent.position.x, agent.appearance.height * .91, agent.position.z); this.dummy.rotation.set(0, agent.heading, 0); this.dummy.scale.setScalar(agent.appearance.height / 1.72); this.dummy.updateMatrix(); mesh!.setMatrixAt(i, this.dummy.matrix); });
      mesh.count = agents.length; mesh.instanceMatrix.needsUpdate = true; mesh.visible = true;
    }
    this.farDirty = false;
  }

  markFarDirty(): void { this.farDirty = true; }
  dispose(): void {
    for (const agent of this.agents.values()) if (agent.renderObject) this.scene.remove(agent.renderObject);
    for (const mesh of [...this.farBodies.values(), ...this.farHeads.values()]) { this.scene.remove(mesh); mesh.dispose(); }
    Object.values(this.geometry).forEach(geometry => geometry.dispose());
    this.materialCache.forEach(material => material.dispose());
    this.agents.clear(); this.farBodies.clear(); this.farHeads.clear();
  }
}
