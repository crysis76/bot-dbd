const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} = require("discord.js");

const perksData = require("../data/perks.json");

/* 🔁 Aplatir toutes les perks */
const allPerks = [
  ...(perksData.common ?? []).map(p => ({ ...p, category: "common" })),
  ...(perksData.survivor ?? []).map(p => ({ ...p, category: "survivor" })),
  ...(perksData.killer ?? []).map(p => ({ ...p, category: "killer" }))
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("perk")
    .setDescription("Afficher les perks de Dead by Daylight")
    .addStringOption(option =>
      option
        .setName("nom")
        .setDescription("Rechercher une perk")
        .setAutocomplete(true)
        .setRequired(false)
    ),

  /* =====================
     AUTOCOMPLETE (SAFE)
  ===================== */
  async autocomplete(interaction) {
    try {
      const focused = interaction.options.getFocused(true);
      if (focused.name !== "nom") {
        return interaction.respond([]);
      }

      const value = focused.value.toLowerCase();

      const results = allPerks
        .filter(p => p.name.toLowerCase().includes(value))
        .slice(0, 25)
        .map(p => ({
          name: p.name,
          value: p.id
        }));

      return interaction.respond(results);
    } catch {
      // ⚠️ autocomplete ne doit JAMAIS throw
      return;
    }
  },

  /* =====================
     EXECUTE
  ===================== */
  async execute(interaction) {
    // ⚠️ deferReply est géré dans index.js

    const perkId = interaction.options.getString("nom");

    /* 🔍 PERK UNIQUE */
    if (perkId) {
      const perk = allPerks.find(p => p.id === perkId);

      if (!perk) {
        return interaction.editReply({
          content: "❌ Perk introuvable."
        });
      }

      const color =
        perk.category === "survivor"
          ? 0x2ecc71
          : perk.category === "killer"
          ? 0xe74c3c
          : 0x3498db;

      const embed = new EmbedBuilder()
        .setTitle(perk.name)
        .setDescription(perk.description)
        .setColor(color)
        .setFooter({
          text:
            perk.category === "survivor"
              ? "🟢 Perk survivant"
              : perk.category === "killer"
              ? "🔴 Perk tueur"
              : "🔵 Perk commune"
        });

      if (perk.owner) {
        embed.addFields({
          name: "Propriétaire",
          value: perk.owner.replace(/_/g, " "),
          inline: true
        });
      }

      return interaction.editReply({ embeds: [embed] });
    }

    /* 📚 MENU CATÉGORIES */
    const embed = new EmbedBuilder()
      .setTitle("📚 Perks – Dead by Daylight")
      .setDescription(
        "Choisis une catégorie :\n\n" +
        "🔵 **Perks communes**\n" +
        "🟢 **Perks survivants**\n" +
        "🔴 **Perks tueurs**"
      )
      .setColor(0x5865F2);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("perk_common_0")
        .setLabel("Communes")
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId("perk_survivor_0")
        .setLabel("Survivants")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId("perk_killer_0")
        .setLabel("Tueurs")
        .setStyle(ButtonStyle.Danger)
    );

    return interaction.editReply({
      embeds: [embed],
      components: [row]
    });
  }
};
