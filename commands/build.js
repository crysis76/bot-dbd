const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const perks = require('../data/perks.json');
const { generateBuild } = require('../scripts/buildGenerator');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('build')
    .setDescription('Génère un build DBD intelligent')
    .addStringOption(o =>
      o.setName('type')
        .setDescription('Survivor ou Killer')
        .setRequired(true)
        .addChoices(
          { name: 'Survivor', value: 'survivor' },
          { name: 'Killer', value: 'killer' }
        )
    )
    .addStringOption(o =>
      o.setName('tag')
        .setDescription('Style du build (chase, slowdown, info, fun, meta...)')
        .setRequired(true)
        .setAutocomplete(true) // ✅ AUTOCOMPLETE
    ),

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused(true);
    if (focused.name !== 'tag') return;

    const type = interaction.options.getString('type');
    if (!type) return interaction.respond([]);

    // 🔍 perks selon le type
    const pool =
      type === 'killer'
        ? perks.common.filter(p => p.type === 'killer')
        : [
            ...perks.common.filter(p => p.type === 'survivor'),
            ...(perks.survivor || [])
          ];

    // 🏷️ tags uniques
    const tags = [
      ...new Set(
        pool.flatMap(p => Array.isArray(p.tags) ? p.tags : [])
      )
    ];

    const value = focused.value.toLowerCase();

    const choices = tags
      .filter(t => t.toLowerCase().includes(value))
      .slice(0, 25)
      .map(t => ({ name: t, value: t }));

    return interaction.respond(choices);
  },

  async execute(interaction) {
    const type = interaction.options.getString('type');
    const tag = interaction.options.getString('tag');

    const build = generateBuild(perks, type, tag);

    if (!build.length) {
      return interaction.reply({
        content: '❌ Aucun build trouvé avec ces critères.',
        flags: 64
      });
    }

    const embed = new EmbedBuilder()
      .setTitle(`🎯 Build ${type.toUpperCase()} — ${tag}`)
      .addFields({
        name: 'Perks',
        value: build.map(p => `• **${p.name}**`).join('\n')
      })
      .setColor(type === 'killer' ? 0xb71c1c : 0x2e7d32);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`build_reroll_${type}_${tag}_normal`)
        .setLabel('Reroll')
        .setEmoji('🔄')
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({
      embeds: [embed],
      components: [row]
    });
  }
};
