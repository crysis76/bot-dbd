const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const path = require('path');
const { loadAll, loadOne } = require('../utils/loadData');

const dataPath = path.join(__dirname, '../data/killers');
const killers = loadAll(dataPath);

module.exports = {
  data: new SlashCommandBuilder()
    .setName('killer')
    .setDescription('Infos complètes sur un killer DBD')
    .addStringOption(o =>
      o.setName('nom')
        .setDescription('Choisis un killer')
        .setRequired(true)
        .setAutocomplete(true)
    ),

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused().toLowerCase();

    return interaction.respond(
      killers
        .filter(k => k.name.toLowerCase().includes(focused))
        .slice(0, 25)
        .map(k => ({
          name: k.name,
          value: k.id
        }))
    );
  },

  async execute(interaction) {
    // ✅ STRATÉGIE UNIQUE
    await interaction.deferReply();

    const id = interaction.options.getString('nom');
    const killer = loadOne(dataPath, id);

    if (!killer) {
      return interaction.editReply({
        content: '❌ Killer introuvable.'
      });
    }

    /* =================
       🔪 POUVOIR
    ================= */
    let powerText = 'Pouvoir inconnu';

    if (killer.power) {
      if (typeof killer.power === 'string') {
        powerText = killer.power;
      } else {
        powerText =
          `**${killer.power.name ?? 'Pouvoir'}**\n` +
          (killer.power.description ?? 'Pas de description');
      }
    }

    const embed = new EmbedBuilder()
      .setTitle(killer.name ?? 'Killer inconnu')
      .setDescription(killer.description ?? 'Aucune description')
      .setThumbnail(killer.image ?? null)
      .addFields({
        name: '🔪 Pouvoir',
        value: powerText
      })
      .setColor('#B71C1C')
      .setFooter({ text: 'Dead by Daylight — Killer' });

    /* =================
       🧠 PERKS
    ================= */
    if (Array.isArray(killer.perks)) {
      killer.perks.forEach(perk => {
        let perkDescription = 'Pas de description';

        if (perk?.description) {
          perkDescription = perk.description;
        } else if (perk?.description_tiers) {
          const tiers = perk.description_tiers;

          perkDescription = [
            tiers.tier1 && `**Tier I** : ${tiers.tier1}`,
            tiers.tier2 && `**Tier II** : ${tiers.tier2}`,
            tiers.tier3 && `**Tier III** : ${tiers.tier3}`
          ]
            .filter(Boolean)
            .join('\n');
        }

        embed.addFields({
          name: `🧠 ${perk?.name ?? 'Perk inconnu'}`,
          value: perkDescription
        });
      });
    }

    /* =================
       ➕ BOUTON ADD-ONS
    ================= */
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`addons_open_${id}`)
        .setLabel('🎒 Add-ons')
        .setStyle(ButtonStyle.Primary)
    );

    return interaction.editReply({
      embeds: [embed],
      components: [row]
    });
  }
};
