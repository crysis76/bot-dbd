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
     AUTOCOMPLETE
  ===================== */
  async autocomplete(interaction) {
    const focusedValue =
      interaction.options.getFocused()?.toLowerCase() ?? "";

    const filtered = allPerks
      .filter(perk =>
        perk.name.toLowerCase().includes(focusedValue)
      )
      .slice(0, 25);

    await interaction.respond(
      filtered.map(perk => ({
        name: perk.name,
        value: perk.id
      }))
    );
  },

  /* =====================
     EXECUTION
  ===================== */
  async execute(interaction) {
    const perkId = interaction.options.getString("nom");

    /* 🔍 AFFICHAGE D’UNE PERK */
    if (perkId) {
      const perk = allPerks.find(p => p.id === perkId);

      if (!perk) {
        return interaction.reply({
          content: "❌ Perk introuvable.",
          flags: 64
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

      // ✅ AJOUT DU CHAMP SEULEMENT S’IL EXISTE
      if (perk.owner) {
        embed.addFields({
          name: "Propriétaire",
          value: perk.owner.replace(/_/g, " "),
          inline: true
        });
      }

      return interaction.reply({ embeds: [embed] });
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
        .setCustomId("perk_common")
        .setLabel("Communes")
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId("perk_survivor")
        .setLabel("Survivants")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId("perk_killer")
        .setLabel("Tueurs")
        .setStyle(ButtonStyle.Danger)
    );

    await interaction.reply({
      embeds: [embed],
      components: [row]
    });
  }
};
