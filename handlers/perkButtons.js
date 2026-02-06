const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const perks = require("../data/perks.json");

module.exports = async function handlePerkButtons(interaction) {
  let list;
  let title;

  if (interaction.customId === "perk_common") {
    list = perks.common;
    title = "🔵 Perks communes";
  }

  if (interaction.customId === "perk_survivor") {
    list = perks.survivor;
    title = "🟢 Perks survivants";
  }

  if (interaction.customId === "perk_killer") {
    list = perks.killer;
    title = "🔴 Perks tueurs";
  }

  if (!list) return;

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setColor("#2f3136");

  list.slice(0, 5).forEach(perk => {
    embed.addFields({
      name: perk.name,
      value: perk.description.substring(0, 200) + "..."
    });
  });

  const row = new ActionRowBuilder();

  if (list[0]?.owner) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`perk_owner_${list[0].owner}`)
        .setLabel("Voir le personnage")
        .setStyle(ButtonStyle.Primary)
    );
  }

  await interaction.update({ embeds: [embed], components: row.components.length ? [row] : [] });
};
