export function createFollowCamera({ THREE, camera, player, input }) {
  const target = new THREE.Vector3();
  const desiredPosition = new THREE.Vector3();

  function update(delta) {
    const { yaw, distance } = input.getCamera();

    // Camera orbit is independent of character facing to prevent movement feedback.
    desiredPosition.set(
      player.root.position.x - Math.sin(yaw) * distance,
      player.root.position.y + 4.1 + distance * 0.16,
      player.root.position.z - Math.cos(yaw) * distance
    );

    const smoothing = 1 - Math.exp(-Math.min(delta, 1 / 30) * 5.5);
    camera.position.lerp(desiredPosition, smoothing);
    target.set(player.root.position.x, 1.15, player.root.position.z);
    camera.lookAt(target);
  }

  return { update };
}
