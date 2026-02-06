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

  /* =====================
     AUTOCOMPLETE
  ===================== */
  async autocomplete(interaction) {
    const focused = interaction.options.getFocused().toLowerCase();

    return interaction.respond(
      survivors
        .filter(s => s.name.toLowerCase().includes(focused))
        .slice(0, 25)
        .map(s => ({ name: s.name, value: s.id }))
    );
  },

  /* =====================
     EXECUTION
  ===================== */
  async execute(interaction) {
    // ❌ PAS de deferReply ici

    const id = interaction.options.getString('nom');
    const surv = loadOne(dataPath, id);

    if (!surv) {
      return interaction.editReply({
        content: '❌ Survivant introuvable.'
      });
    }

    const embed = new EmbedBuilder()
      .setTitle(surv.name ?? 'Survivant inconnu')
      .setDescription(surv.description ?? 'Aucune description')
      .setThumbnail(surv.image ?? null)
      .setColor('#4CAF50')
      .setFooter({ text: 'Dead by Daylight — Survivant' });

    /* =================
       🧠 PERKS
    ================= */
    if (Array.isArray(surv.perks)) {
      surv.perks.forEach(perk => {
        const tiers = perk.description_tiers ?? {};

        const desc = [
          tiers.tier1 && `**Tier I** : ${tiers.tier1}`,
          tiers.tier2 && `**Tier II** : ${tiers.tier2}`,
          tiers.tier3 && `**Tier III** : ${tiers.tier3}`
        ]
          .filter(Boolean)
          .join('\n') || 'Pas de description';

        embed.addFields({
          name: `🧠 ${perk.name ?? 'Perk inconnu'}`,
          value: `${perk.icon ? `[🖼️ Icône](${perk.icon})\n` : ''}${desc}`,
          inline: false
        });
      });
    }

    return interaction.editReply({
      embeds: [embed]
    });
  }
};
