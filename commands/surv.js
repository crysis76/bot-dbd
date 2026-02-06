const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const path = require('path');
const { loadAll, loadOne } = require('../utils/loadData');

const dataPath = path.join(__dirname, '../data/survivors');
const survivors = loadAll(dataPath);

module.exports = {
  data: new SlashCommandBuilder()
    .setName('surv')
    .setDescription('Infos complètes sur un survivant DBD')
    .addStringOption(o =>
      o.setName('nom')
        .setDescription('Choisis un survivant')
        .setRequired(true)
        .setAutocomplete(true)
    ),

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused().toLowerCase();

    await interaction.respond(
      survivors
        .filter(s => s.name.toLowerCase().includes(focused))
        .slice(0, 25)
        .map(s => ({ name: s.name, value: s.id }))
    );
  },

  async execute(interaction) {
    const id = interaction.options.getString('nom');
    const surv = loadOne(dataPath, id);

    if (!surv) {
      return interaction.reply({
        content: '❌ Survivant introuvable.',
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setTitle(surv.name)
      .setDescription(surv.description)
      .setThumbnail(surv.image)
      .setColor('#4CAF50')
      .setFooter({ text: 'Dead by Daylight — Survivant' });

    // 🧠 PERKS AVEC TIERS + ICÔNES
    surv.perks.forEach(perk => {
      const desc =
`**Tier I:** ${perk.description_tiers.tier1}
**Tier II:** ${perk.description_tiers.tier2}
**Tier III:** ${perk.description_tiers.tier3}`;

      embed.addFields({
        name: `🧠 ${perk.name}`,
        value: `[🖼️ Icône](${perk.icon})\n${desc}`,
        inline: false
      });
    });

    await interaction.reply({ embeds: [embed] });
  }
};
