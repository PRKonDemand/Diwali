const DISTRICTS = [
  { id: "residential", name: "Residential Colony", short: "RESIDENTIAL", x: -156, z: -180, color: "#77c69b", radius: 74 },
  { id: "market", name: "Main Market", short: "MAIN MARKET", x: 0, z: -180, color: "#f0b45d", radius: 74 },
  { id: "festival", name: "Festival Square", short: "FESTIVAL", x: 205, z: 65, color: "#f28a67", radius: 82 },
  { id: "premium", name: "Premium Colony", short: "PREMIUM", x: 156, z: 180, color: "#a99af0", radius: 74 },
  { id: "highway", name: "Highway District", short: "HIGHWAY", x: 0, z: 245, color: "#6fc6dc", radius: 65 },
  { id: "centre", name: "City Centre", short: "CITY CENTRE", x: 0, z: 0, color: "#f1d477", radius: 78 }
];

const FESTIVAL_ANCHORS = [
  { x: 205, z: 65 },
  { x: -205, z: 65 }
];

export function createDistrictSystem() {
  function getCurrentDistrict(x, z) {
    let closest = null;
    let closestDistance = Infinity;

    for (const district of DISTRICTS) {
      const anchors = district.id === "festival" ? FESTIVAL_ANCHORS : [district];
      for (const anchor of anchors) {
        const distance = Math.hypot(x - anchor.x, z - anchor.z);
        if (distance < closestDistance) {
          closestDistance = distance;
          closest = district;
        }
      }
    }

    return closestDistance <= 118 ? closest : null;
  }

  return {
    districts: DISTRICTS,
    getCurrentDistrict
  };
}
