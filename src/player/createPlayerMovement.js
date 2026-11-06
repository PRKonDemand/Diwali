export function createPlayerMovement({ THREE, player, city, input, speed = 5 }) {
  const position = player.root.position;

  function update(delta, elapsed = 0) {
    const frameDelta = Math.min(Math.max(delta, 0), 1 / 30);
    const intent = input.getMovement();
    const inputLength = Math.hypot(intent.x, intent.y);
    if (inputLength < 0.001 || frameDelta === 0) {
      player.updateWalk(elapsed, false);
      return false;
    }

    // Movement is relative to the camera only. Player facing is output, never input.
    const cameraYaw = input.getCamera().yaw;
    const forwardX = Math.sin(cameraYaw);
    const forwardZ = Math.cos(cameraYaw);
    const rightX = Math.cos(cameraYaw);
    const rightZ = -Math.sin(cameraYaw);

    const moveX = rightX * intent.x + forwardX * intent.y;
    const moveZ = rightZ * intent.x + forwardZ * intent.y;
    const magnitude = Math.hypot(moveX, moveZ);
    if (magnitude < 0.001) {
      player.updateWalk(elapsed, false);
      return false;
    }

    const directionX = moveX / magnitude;
    const directionZ = moveZ / magnitude;
    const distance = speed * frameDelta;
    const nextX = THREE.MathUtils.clamp(position.x + directionX * distance, -84, 84);
    const nextZ = THREE.MathUtils.clamp(position.z + directionZ * distance, -84, 84);

    // Resolve each axis independently so walls do not stop movement along the free axis.
    if (!city.isBlocked(nextX, position.z)) position.x = nextX;
    if (!city.isBlocked(position.x, nextZ)) position.z = nextZ;

    player.root.rotation.y = Math.atan2(directionX, directionZ);
    player.updateWalk(elapsed, true);
    return true;
  }

  return { update };
}
