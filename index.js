require("dotenv").config();

const fs = require("fs");
const path = require("path");
const {
  Client,
  Collection,
  GatewayIntentBits,
  EmbedBuilder
} = require("discord.js");

const perksData = require("./data/perks.json");
const { handleAddons } = require("./handlers/addons");
const { handlePerks } = require("./handlers/perks");
const { generateBuild } = require("./scripts/buildGenerator");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.commands = new Collection();

/* =======================
   COMMANDES
======================= */

const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));

  if (!command.data || !command.execute) {
    console.warn(`⚠️ Commande invalide : ${file}`);
    continue;
  }

  client.commands.set(command.data.name, command);
}

/* =========
   READY
========= */

// v15 friendly
client.once("clientReady", () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`);
});

/* ==========================
   INTERACTION CREATE
========================== */

client.on("interactionCreate", async interaction => {
  try {
    /* 🔍 AUTOCOMPLETE */
    if (interaction.isAutocomplete()) {
      const command = client.commands.get(interaction.commandName);
      if (!command?.autocomplete) return;
      return await command.autocomplete(interaction);
    }

    /* 🔘 BOUTONS & SELECT MENUS */
    if (interaction.isButton() || interaction.isStringSelectMenu()) {

      // 🧩 ADD-ONS (boutons + select rareté)
      if (interaction.customId.startsWith("addons_")) {
        return await handleAddons(interaction);
      }

      // 🧩 PERKS (catégories / retour)
      if (interaction.customId.startsWith("perk_")) {
        return await handlePerks(interaction);
      }

      // 🔄 BUILD REROLL
      if (interaction.customId.startsWith("build_")) {
        const [, action, camp, category] =
          interaction.customId.split("_");

        if (action !== "reroll") {
          return interaction.deferUpdate();
        }

        const build = generateBuild(perksData, camp, category);

        if (!Array.isArray(build) || build.length === 0) {
          return interaction.update({
            content: "❌ Impossible de reroll ce build.",
            embeds: [],
            components: []
          });
        }

        const embed = EmbedBuilder.from(interaction.message.embeds[0]);

        const perksText = build
          .map(p => `• **${p.name}**`)
          .join("\n");

        const fieldIndex =
          embed.data.fields?.findIndex(f => f.name === "Perks") ?? -1;

        if (fieldIndex !== -1) {
          embed.spliceFields(fieldIndex, 1, {
            name: "Perks",
            value: perksText
          });
        } else {
          embed.addFields({
            name: "Perks",
            value: perksText
          });
        }

        return interaction.update({ embeds: [embed] });
      }

      // 🛑 sécurité : interaction non reconnue
      return interaction.deferUpdate();
    }

    /* 💬 SLASH COMMAND */
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    await command.execute(interaction);

  } catch (error) {
    console.error("❌ Erreur interaction :", error);

    const reply = {
      content: "❌ Une erreur est survenue.",
      ephemeral: true
    };

    if (interaction.deferred || interaction.replied) {
      await interaction.followUp(reply).catch(() => {});
    } else {
      await interaction.reply(reply).catch(() => {});
    }
  }
});

client.login(process.env.TOKEN);
