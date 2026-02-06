const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../data/perks.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

function enrich(perk) {
  const tags = perk.tags || [];

  let power = 2;
  let tournament = true;
  let fun = false;

  if (tags.includes('meta') || tags.includes('tryhard')) {
    power = 5;
  }

  if (tags.includes('slowdown')) {
    power = Math.max(power, 4);
  }

  if (tags.includes('chase')) {
    power = Math.max(power, 3);
  }

  if (tags.includes('fun') || tags.includes('meme')) {
    fun = true;
    power = 1;
    tournament = false;
  }

  if (tags.includes('hex') || tags.includes('totem')) {
    tournament = false;
  }

  // influence du weight (si présent)
  if (typeof perk.weight === 'number') {
    if (perk.weight >= 7) power = Math.max(power, 4);
    if (perk.weight <= 1 && !tags.includes('meta')) power = Math.min(power, 2);
  }

  return {
    ...perk,
    power,
    tournament,
    fun
  };
}

// 🔁 applique à toutes les catégories
for (const key of Object.keys(data)) {
  if (Array.isArray(data[key])) {
    data[key] = data[key].map(enrich);
  }
}

// 💾 sauvegarde
fs.writeFileSync(
  filePath,
  JSON.stringify(data, null, 2),
  'utf8'
);

console.log('✅ perks.json enrichi avec power / tournament / fun');
