export function createPlayerMovement({ THREE, player, city, input, speed = 5 }) {
  const position = player.root.position;
  let currentSpeed = speed;

  function update(delta, elapsed = 0) {
    const frameDelta = Math.min(Math.max(delta, 0), 1 / 30);
    const intent = input.getMovement();
    const inputLength = Math.hypot(intent.x, intent.y);
    if (inputLength < 0.001 || frameDelta === 0) {
      player.updateWalk(elapsed, false);
      return false;
    }

    // Camera-relative direction; joystick displacement controls walking intensity.
    const cameraYaw = input.getCamera().yaw;
    const forwardX = Math.sin(cameraYaw);
    const forwardZ = Math.cos(cameraYaw);
    // The follow camera sits behind the player and looks toward +Z at yaw 0.
    // Its screen-right axis therefore points toward world -X (not +X).
    const rightX = -Math.cos(cameraYaw);
    const rightZ = Math.sin(cameraYaw);
    const moveX = rightX * intent.x + forwardX * intent.y;
    const moveZ = rightZ * intent.x + forwardZ * intent.y;
    const magnitude = Math.hypot(moveX, moveZ);
    if (magnitude < 0.001) {
      player.updateWalk(elapsed, false);
      return false;
    }

    const directionX = moveX / magnitude;
    const directionZ = moveZ / magnitude;
    const distance = currentSpeed * frameDelta * Math.min(inputLength, 1);
    const nextX = THREE.MathUtils.clamp(position.x + directionX * distance, -270, 270);
    const nextZ = THREE.MathUtils.clamp(position.z + directionZ * distance, -270, 270);
    if (!city.isBlocked(nextX, position.z)) position.x = nextX;
    if (!city.isBlocked(position.x, nextZ)) position.z = nextZ;

    player.root.rotation.y = Math.atan2(directionX, directionZ);
    player.updateWalk(elapsed, true);
    return true;
  }

  return {
    update,
    setSpeed(value) {
      currentSpeed = Math.min(8, Math.max(1, Number(value) || speed));
    }
  };
}