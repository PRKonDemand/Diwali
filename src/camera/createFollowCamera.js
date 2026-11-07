export function createFollowCamera({ THREE, camera, player, input }) {
  const target = new THREE.Vector3();
  const desiredPosition = new THREE.Vector3();
  const forward = new THREE.Vector3();

  function update(delta, driving = false, car = null) {
    const { yaw, distance, mode } = input.getCamera();
    const subject = driving && car ? car.root : player.root;
    const smoothing = 1 - Math.exp(-Math.min(delta, 1 / 30) * 7);

    if (mode === "first") {
      // Put the view just behind the windscreen when driving, or at eye level on foot.
      forward.set(Math.sin(yaw), 0, Math.cos(yaw));
      desiredPosition.set(
        subject.position.x + (driving ? forward.x * 0.55 : 0),
        subject.position.y + (driving ? 1.48 : 1.68),
        subject.position.z + (driving ? forward.z * 0.55 : 0)
      );
      target.copy(desiredPosition).addScaledVector(forward, 12);
      target.y -= driving ? 0.12 : 0.08;
      camera.position.lerp(desiredPosition, smoothing);
      camera.lookAt(target);
      player.root.visible = driving ? false : false;
      return;
    }

    player.root.visible = !driving;
    desiredPosition.set(
      subject.position.x - Math.sin(yaw) * distance,
      subject.position.y + (driving ? 3.1 : 4.1) + distance * 0.16,
      subject.position.z - Math.cos(yaw) * distance
    );
    camera.position.lerp(desiredPosition, smoothing);
    target.set(subject.position.x, driving ? 1.0 : 1.15, subject.position.z);
    camera.lookAt(target);
  }

  return { update };
}
