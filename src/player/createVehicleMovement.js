export function createVehicleMovement({ THREE, player, car, city, input }) {
  let speed = 0;
  const maxForwardSpeed = 21;
  const maxReverseSpeed = 7;
  const acceleration = 10;
  const braking = 15;
  const drag = 5.5;

  function update(delta) {
    const dt = Math.min(Math.max(delta, 0), 1 / 30);
    const intent = input.getMovement();
    const throttle = THREE.MathUtils.clamp(intent.y, -1, 1);
    const steering = THREE.MathUtils.clamp(intent.x, -1, 1);

    if (throttle > 0.04) speed = Math.min(maxForwardSpeed, speed + acceleration * throttle * dt);
    else if (throttle < -0.04) {
      if (speed > 0.5) speed = Math.max(0, speed - braking * -throttle * dt);
      else speed = Math.max(-maxReverseSpeed, speed - acceleration * -throttle * dt);
    } else {
      const amount = drag * dt;
      speed = Math.abs(speed) <= amount ? 0 : speed - Math.sign(speed) * amount;
    }

    if (Math.abs(speed) > 0.08) {
      const steeringStrength = 0.32 + Math.min(Math.abs(speed) / maxForwardSpeed, 1) * 1.05;
      const reverseFactor = speed >= 0 ? 1 : -1;
      player.root.rotation.y += steering * steeringStrength * dt * reverseFactor;
    }

    const yaw = player.root.rotation.y;
    const nextX = player.root.position.x + Math.sin(yaw) * speed * dt;
    const nextZ = player.root.position.z + Math.cos(yaw) * speed * dt;
    const radius = 1.15;
    const clampedX = THREE.MathUtils.clamp(nextX, -268, 268);
    const clampedZ = THREE.MathUtils.clamp(nextZ, -268, 268);

    if (!city.isBlocked(clampedX, clampedZ, radius)) {
      player.root.position.set(clampedX, 0, clampedZ);
    } else {
      speed = 0;
    }

    car.root.position.copy(player.root.position);
    car.root.rotation.y = player.root.rotation.y;
    car.update(dt, speed);
    return speed;
  }

  return {
    update,
    stop() { speed = 0; },
    getSpeed() { return speed; }
  };
}
