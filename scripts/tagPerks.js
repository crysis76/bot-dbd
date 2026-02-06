const fs = require("fs");
const path = require("path");

const perksPath = path.join(__dirname, "../data/perks.json");
const perksData = JSON.parse(fs.readFileSync(perksPath, "utf8"));

/* ================= TAG NORMALIZER ================= */

const normalizeTag = tag =>
  tag
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, "_");

/* ================= TAG RULES ================= */

// Règles de correspondance pour les tags
const TAG_RULES = [
  { tag: "hex", match: /hex/i },
  { tag: "end_game", match: /porte|fin de partie|générateur/i },
  { tag: "slowdown", match: /ralent|lent|réduit|cooldown/i },
  { tag: "stealth", match: /dispara|silenc|indétect/i },
  { tag: "info", match: /aura|révèle|détect|alerte/i },
  { tag: "anti_loop", match: /palette|fenêtre|vault/i },
  { tag: "chase", match: /vitesse|poursuite/i },
  { tag: "totem", match: /totem/i },
  { tag: "support", match: /soigne|répare|coop/i }
];

/* ================= TAGS MANUELS ================= */

const FIXED_TAGS = {
  hex_no_one_escapes_death: ["meta", "tryhard", "end_game", "hex"],
  insidious: ["stealth", "fun", "meme"],
  prove_thyself: ["meta", "tryhard", "support"],
  spine_chill: ["info", "anti_loop"]
};

/* ================= PONDERATION DES TAGS ================= */

// Pondération des tags pour chaque catégorie
const TAG_WEIGHTS = {
  meta: 5,
  fun: 1,
  tryhard: 4,
  "anti-loop": 3,
  stealth: 2,
  slowdown: 3,
  aura: 2,
  "end-game": 4,
  "anti-slug": 3
};

/* ================= TAGGING ET PONDERATION ================= */

// Fonction pour attribuer des tags et leur pondération aux perks
for (const category of Object.keys(perksData)) {
  if (!Array.isArray(perksData[category])) continue;

  perksData[category] = perksData[category].map(perk => {
    const tags = new Set((perk.tags || []).map(normalizeTag));

    // 🎯 tags manuels
    if (FIXED_TAGS[perk.id]) {
      FIXED_TAGS[perk.id].map(normalizeTag).forEach(t => tags.add(t));
    }

    // 🤖 tags auto (règles)
    TAG_RULES.forEach(rule => {
      if (
        rule.match.test(perk.name) ||
        rule.match.test(perk.description || "")
      ) {
        tags.add(rule.tag);
      }
    });

    // 🎈 fallback pour les perks sans tags
    if (tags.size === 0) {
      tags.add("fun");
    }

    // Ajout de la pondération des tags
    const weight = [...tags].reduce((acc, tag) => acc + (TAG_WEIGHTS[tag] || 0), 0);

    return {
      ...perk,
      tags: [...tags],
      weight
    };
  });
}

/* ================= SYNERGIES ENTRE PERKS ================= */

// Définir des synergies entre certaines perks
const SYNERGIES = [
  {
    perks: ["distressing", "sloppy_butcher"], // Exemple : Synergie entre "distressing" et "sloppy_butcher"
    effect: "Ces perks augmentent la zone de terreur et l'effet de saignement simultanément !"
  },
  {
    perks: ["hex_no_one_escapes_death", "hex_thrill_of_the_hunt"],
    effect: "Les perks Hex fonctionnent bien ensemble pour un build plus puissant en fin de partie."
  }
];

// Fonction pour appliquer les synergies
function applySynergies(perks) {
  const appliedSynergies = SYNERGIES.filter(synergy =>
    synergy.perks.every(p =>
      perks.some(perk => perk && perk.id && perk.id === p) // Vérification que le perk existe et possède une id valide
    )
  );

  return appliedSynergies;
}

/* ================= FONCTION POUR GÉNÉRER UN BUILD ================= */

// Fonction pour générer un build en fonction des catégories et pondérations
function generateBuild(camp, categories) {
  let selectedPerks = [];

  // Accéder à toutes les perks, puis les filtrer par camp (survivor ou killer)
  const allPerks = Object.values(perksData).flat().filter(p => p.type === camp);

  categories.forEach(category => {
    const normalizedCategory = normalizeTag(category);

    const matching = allPerks
      .filter(p =>
        Array.isArray(p.tags) &&
        p.tags.includes(normalizedCategory)
      )
      .sort((a, b) => (b.weight || 0) - (a.weight || 0));

    if (matching.length === 0) return; // Si aucun perk n'est trouvé, on passe au suivant

    const perk = matching[Math.floor(Math.random() * matching.length)];

    // éviter les doublons
    if (!selectedPerks.some(p => p.id === perk.id)) {
      selectedPerks.push(perk);
    }
  });

  // Compléter avec d'autres perks si le build a moins de 4 perks
  const remaining = allPerks.filter(
    p => !selectedPerks.some(sp => sp.id === p.id)
  );

  // Si moins de 4 perks sont choisis, on remplit aléatoirement
  while (selectedPerks.length < 4 && remaining.length) {
    selectedPerks.push(
      remaining.splice(
        Math.floor(Math.random() * remaining.length),
        1
      )[0]
    );
  }

  // Si on a toujours pas 4 perks, on peut autoriser un "reroll" pour générer un build avec des perks aléatoires
  if (selectedPerks.length < 4) {
    const additionalPerks = shuffle(allPerks).slice(0, 4 - selectedPerks.length);
    selectedPerks = [...selectedPerks, ...additionalPerks];
  }

  return selectedPerks;
}

/* ================= SAUVEGARDE ================= */

// Sauvegarder les données avec les tags normalisés et pondérés
fs.writeFileSync(
  perksPath,
  JSON.stringify(perksData, null, 2),
  "utf8"
);

console.log("✅ Tags normalisés, pondérés et synergies appliquées avec succès");

/* ================= GÉNERER UN EXEMPLE DE BUILD ================= */

// Exemple de génération de build
const camp = "killer"; // "survivor" ou "killer"
const categories = ["meta", "slowdown", "anti-loop"]; // Catégories choisies par l'utilisateur
const build = generateBuild(camp, categories);

console.log("🎲 Build généré :", build.map(p => `• ${p.name}`).join("\n"));
