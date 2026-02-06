const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const path = require("path");
const perksData = require(path.join(__dirname, "../data/perks.json"));

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

module.exports.handleBuild = async interaction => {
  const [, action, camp, categorie] = interaction.customId.split("_");

  // 🔎 Filtre perks par camp (survivor / killer)
  const allPerks = perksData.filter(p => p.type === camp);

  if (!allPerks.length) {
    return interaction.reply({
      content: "❌ Aucune perk trouvée pour ce camp.",
      ephemeral: true
    });
  }

  // 🔁 Récupère les perks déjà affichées (pour le lock)
  let lockedPerks = [];

  if (action === "lock") {
    const perksField = interaction.message.embeds[0]
      ?.fields.find(f => f.name === "Perks");

    if (perksField) {
      const names = perksField.value
        .match(/\*\*(.+?)\*\*/g)
        ?.map(p => p.replace(/\*\*/g, ""));

      if (names?.length) {
        const lockedName = names[Math.floor(Math.random() * names.length)];
        const locked = allPerks.find(p => p.name === lockedName);
        if (locked) lockedPerks.push(locked);
      }
    }
  }

  // 🎲 Génération perks
  const pool = allPerks.filter(
    p => !lockedPerks.some(l => l.id === p.id)
  );

  const newPerks = [
    ...lockedPerks,
    ...shuffle(pool)
  ].slice(0, 4);

  // 🧱 Embed
  const embed = new EmbedBuilder()
    .setTitle("🎲 Build régénéré")
    .setColor(camp === "killer" ? 0xff0000 : 0x00ff99)
    .addFields(
      { name: "Camp", value: camp, inline: true },
      { name: "Catégorie", value: categorie, inline: true },
      {
        name: "Perks",
        value: newPerks.map(p => `• **${p.name}**`).join("\n")
      }
    );

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`build_reroll_${camp}_${categorie}`)
      .setLabel("🎲 Reroll")
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId(`build_lock_${camp}_${categorie}`)
      .setLabel("🔒 Lock une perk")
      .setStyle(ButtonStyle.Secondary)
  );

  await interaction.update({
    embeds: [embed],
    components: [row]
  });
};
