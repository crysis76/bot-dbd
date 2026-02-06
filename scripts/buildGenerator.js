function weightedRandom(perks) {
  const pool = [];
  for (const perk of perks) {
    const weight = perk.weight ?? 1;
    for (let i = 0; i < Math.max(weight, 1); i++) {
      pool.push(perk);
    }
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

function generateBuild(perksData, type, tag) {
  let available = [];

  if (type === 'killer') {
    available = perksData.common.filter(p => p.type === 'killer');
  }

  if (type === 'survivor') {
    available = [
      ...perksData.common.filter(p => p.type === 'survivor'),
      ...perksData.survivor
    ];
  }

  const tagged = available.filter(p => p.tags?.includes(tag));
  const build = [];

  // 3 perks orientées catégorie
  while (build.length < 3 && tagged.length) {
    const perk = weightedRandom(tagged);
    if (!build.find(p => p.id === perk.id)) {
      build.push(perk);
    }
  }

  // Compléter jusqu'à 4 perks
  const remaining = available.filter(
    p => !build.find(b => b.id === p.id)
  );

  while (build.length < 4 && remaining.length) {
    const perk = weightedRandom(remaining);
    if (!build.find(p => p.id === perk.id)) {
      build.push(perk);
    }
  }

  return build;
}

module.exports = { generateBuild };
