export function createMinimap(canvas, districts) {
  const context = canvas.getContext("2d");
  const size = 220;
  const worldMin = -285;
  const worldMax = 285;
  const worldSize = worldMax - worldMin;
  const points = [
    { x: 205, z: 65, label: "TEMPLE", color: "#ffd477" },
    { x: -205, z: 65, label: "PLAZA", color: "#ff9c72" }
  ];

  function toMap(x, z) {
    return {
      x: 12 + ((x - worldMin) / worldSize) * (size - 24),
      y: 12 + ((z - worldMin) / worldSize) * (size - 24)
    };
  }

  function roundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
  }

  function drawRoads() {
    context.strokeStyle = "rgba(255,255,255,.23)";
    context.lineWidth = 3;
    [-105, 0, 105].forEach((x) => {
      const a = toMap(x, worldMin);
      const b = toMap(x, worldMax);
      context.beginPath();
      context.moveTo(a.x, a.y);
      context.lineTo(b.x, b.y);
      context.stroke();
    });
    [-120, 0, 120].forEach((z) => {
      const a = toMap(worldMin, z);
      const b = toMap(worldMax, z);
      context.beginPath();
      context.moveTo(a.x, a.y);
      context.lineTo(b.x, b.y);
      context.stroke();
    });
    context.strokeStyle = "rgba(255,255,255,.12)";
    context.lineWidth = 1;
    context.strokeRect(12, 12, size - 24, size - 24);
  }

  function drawDistricts() {
    districts.forEach((district) => {
      const p = toMap(district.x, district.z);
      const radius = (district.radius / worldSize) * (size - 24);
      context.beginPath();
      context.fillStyle = district.color + "20";
      context.strokeStyle = district.color + "bb";
      context.lineWidth = 1.25;
      context.arc(p.x, p.y, radius, 0, Math.PI * 2);
      context.fill();
      context.stroke();
      context.fillStyle = "rgba(255,245,225,.8)";
      context.font = "700 6.5px system-ui, sans-serif";
      context.textAlign = "center";
      context.fillText(district.short, p.x, p.y + 2);
    });
  }

  function drawLandmarks() {
    points.forEach((point) => {
      const p = toMap(point.x, point.z);
      context.beginPath();
      context.fillStyle = point.color;
      context.shadowColor = point.color;
      context.shadowBlur = 7;
      context.arc(p.x, p.y, 3.2, 0, Math.PI * 2);
      context.fill();
      context.shadowBlur = 0;
    });
  }

  function drawPlayer(position, yaw) {
    const p = toMap(position.x, position.z);
    context.save();
    context.translate(p.x, p.y);
    context.rotate(yaw);
    context.beginPath();
    context.moveTo(0, -7);
    context.lineTo(5, 5);
    context.lineTo(0, 3);
    context.lineTo(-5, 5);
    context.closePath();
    context.fillStyle = "#ffffff";
    context.shadowColor = "#ffc86a";
    context.shadowBlur = 9;
    context.fill();
    context.restore();
    context.shadowBlur = 0;
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function update(position, yaw) {
    context.clearRect(0, 0, size, size);
    context.fillStyle = "rgba(8,14,29,.88)";
    roundedRect(context, 0, 0, size, size, 18);
    context.fill();
    drawDistricts();
    drawRoads();
    drawLandmarks();
    drawPlayer(position, yaw);
  }

  resize();
  return { update, resize };
}
