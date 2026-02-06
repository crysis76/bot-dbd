const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const perksData = require("../data/perks.json");

const PER_PAGE = 20;

module.exports.handlePerks = async interaction => {
  const id = interaction.customId;

  /* 🔙 RETOUR MENU PRINCIPAL */
  if (id === "perk_back") {
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

    return interaction.update({ embeds: [embed], components: [row] });
  }

  /* 📦 CATEGORY + PAGE */
  const [, category, pageStr] = id.split("_");
  const page = parseInt(pageStr ?? "0", 10);

  let perks = [];
  let color = 0x3498db;

  if (category === "common") {
    perks = perksData.common ?? [];
    color = 0x3498db;
  }

  if (category === "survivor") {
    perks = perksData.survivor ?? [];
    color = 0x2ecc71;
  }

  if (category === "killer") {
    perks = perksData.killer ?? [];
    color = 0xe74c3c;
  }

  if (!perks.length) {
    return interaction.reply({
      content: "❌ Aucune perk trouvée.",
      flags: 64
    });
  }

  const maxPage = Math.ceil(perks.length / PER_PAGE) - 1;
  const start = page * PER_PAGE;
  const current = perks.slice(start, start + PER_PAGE);

  const embed = new EmbedBuilder()
    .setTitle(`📚 Perks ${category}`)
    .setColor(color)
    .setFooter({ text: `Page ${page + 1} / ${maxPage + 1}` })
    .setDescription(
      current.map(p => `• **${p.name}**`).join("\n")
    );

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`perk_${category}_${page - 1}`)
      .setEmoji("⬅️")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page <= 0),

    new ButtonBuilder()
      .setCustomId("perk_back")
      .setLabel("Retour")
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId(`perk_${category}_${page + 1}`)
      .setEmoji("➡️")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page >= maxPage)
  );

  return interaction.update({
    embeds: [embed],
    components: [row]
  });
};
