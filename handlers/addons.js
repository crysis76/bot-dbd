const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  EmbedBuilder
} = require("discord.js");

const path = require("path");
const fs = require("fs");
const { loadOne } = require("../utils/loadData");

// ===== CONFIG =====
const ADDONS_PER_PAGE = 10;
const ADDONS_PATH = path.join(__dirname, "../data/add-ons.json");
const KILLERS_PATH = path.join(__dirname, "../data/killers");

// ===== UTILS =====
function loadAddons() {
  if (!fs.existsSync(ADDONS_PATH)) return {};
  return JSON.parse(fs.readFileSync(ADDONS_PATH, "utf8"));
}

const rarityLabels = {
  common: "Commun",
  uncommon: "Peu commun",
  rare: "Rare",
  very_rare: "Très rare",
  iridescent: "Iridescent"
};

// ===== MAIN HANDLER =====
async function handleAddons(interaction) {
  const data = loadAddons();

  /* 📂 OUVERTURE ADD-ONS */
  if (interaction.isButton() && interaction.customId.startsWith("addons_open_")) {
    await interaction.deferUpdate();

    const killerId = interaction.customId.replace("addons_open_", "");
    const addons = data[killerId] ?? [];

    if (!addons.length) {
      return interaction.message.edit({
        content: "❌ Aucun add-on trouvé pour ce tueur.",
        embeds: [],
        components: []
      });
    }

    return showAddons(interaction, killerId, addons, 0, "all");
  }

  /* 🔁 PAGINATION */
  if (interaction.isButton() && interaction.customId.startsWith("addons_page_")) {
    await interaction.deferUpdate();

    const raw = interaction.customId.replace("addons_page_", "");
    const [killerId, page, rarity] = raw.split("|");

    const addons = data[killerId] ?? [];
    return showAddons(interaction, killerId, addons, Number(page), rarity);
  }

  /* 🎯 FILTRE RARETÉ */
  if (interaction.isStringSelectMenu() && interaction.customId.startsWith("addons_rarity_")) {
    await interaction.deferUpdate();

    const killerId = interaction.customId.replace("addons_rarity_", "");
    const rarity = interaction.values[0];
    const addons = data[killerId] ?? [];

    return showAddons(interaction, killerId, addons, 0, rarity);
  }

  /* ⬅ RETOUR AU TUEUR */
  if (interaction.isButton() && interaction.customId.startsWith("addons_back_")) {
    await interaction.deferUpdate();

    const killerId = interaction.customId.replace("addons_back_", "");
    const killer = loadOne(KILLERS_PATH, killerId);

    if (!killer) {
      return interaction.message.edit({
        content: "❌ Impossible de revenir au tueur.",
        embeds: [],
        components: []
      });
    }

    const embed = new EmbedBuilder()
      .setTitle(killer.name)
      .setDescription(killer.description ?? "Aucune description.")
      .setColor(0xb71c1c);

    if (killer.image) embed.setThumbnail(killer.image);

    if (killer.power) {
      embed.addFields({
        name: "🔪 Pouvoir",
        value:
          typeof killer.power === "string"
            ? killer.power
            : `**${killer.power.name}**\n${killer.power.description}`
      });
    }

    if (Array.isArray(killer.perks)) {
      killer.perks.slice(0, 3).forEach(perk => {
        embed.addFields({
          name: `🧠 ${perk.name}`,
          value: perk.description ?? "Pas de description."
        });
      });
    }

    return interaction.message.edit({
      embeds: [embed],
      components: []
    });
  }
}

// ===== DISPLAY ADD-ONS =====
async function showAddons(interaction, killerId, addons, page, rarity) {
  const filtered =
    rarity === "all" ? addons : addons.filter(a => a.rarity === rarity);

  if (!filtered.length) {
    return interaction.message.edit({
      content: "❌ Aucun add-on pour cette rareté.",
      embeds: [],
      components: []
    });
  }

  const maxPage = Math.max(0, Math.ceil(filtered.length / ADDONS_PER_PAGE) - 1);
  page = Math.min(Math.max(page, 0), maxPage);

  const pageAddons = filtered.slice(
    page * ADDONS_PER_PAGE,
    page * ADDONS_PER_PAGE + ADDONS_PER_PAGE
  );

  const killer = loadOne(KILLERS_PATH, killerId);

  const embed = new EmbedBuilder()
    .setTitle(`🎒 Add-ons — ${killer?.name ?? killerId}`)
    .setColor(0x8b0000)
    .setFooter({ text: `Page ${page + 1} / ${maxPage + 1}` });

  pageAddons.forEach(addon => {
    embed.addFields({
      name: addon.name,
      value: `**Rareté :** ${rarityLabels[addon.rarity] ?? "Inconnue"}\n${addon.description ?? "—"}`
    });
  });

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(`addons_rarity_${killerId}`)
    .setPlaceholder("Filtrer par rareté")
    .addOptions(
      { label: "Tous", value: "all" },
      { label: "Commun", value: "common" },
      { label: "Peu commun", value: "uncommon" },
      { label: "Rare", value: "rare" },
      { label: "Très rare", value: "very_rare" },
      { label: "Iridescent", value: "iridescent" }
    );

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`addons_page_${killerId}|${page - 1}|${rarity}`)
      .setLabel("⬅")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page <= 0),

    new ButtonBuilder()
      .setCustomId(`addons_page_${killerId}|${page + 1}|${rarity}`)
      .setLabel("➡")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page >= maxPage),

    new ButtonBuilder()
      .setCustomId(`addons_back_${killerId}`)
      .setLabel("⬅ Retour au tueur")
      .setStyle(ButtonStyle.Danger)
  );

  return interaction.message.edit({
    embeds: [embed],
    components: [
      new ActionRowBuilder().addComponents(selectMenu),
      buttons
    ]
  });
}

module.exports = { handleAddons };
