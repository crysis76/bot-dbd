require("dotenv").config();

/* =======================
   PROTECTION ANTI-CRASH
======================= */
process.on("unhandledRejection", error => {
  console.error("🔥 Unhandled Rejection:", error);
});

process.on("uncaughtException", error => {
  console.error("🔥 Uncaught Exception:", error);
});

/* =======================
   WEB SERVER (RENDER)
======================= */
const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("🤖 Bot DBD en ligne !");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌐 Serveur web actif sur le port ${PORT}`);
});

/* =======================
   DISCORD BOT
======================= */
const fs = require("fs");
const path = require("path");
const {
  Client,
  Collection,
  GatewayIntentBits,
  EmbedBuilder,
  MessageFlags
} = require("discord.js");

const perksData = require("./data/perks.json");
const { handleAddons } = require("./handlers/addons");
const { handlePerks } = require("./handlers/perks");
const { generateBuild } = require("./scripts/buildGenerator");

/* 🔒 SALON AUTORISÉ */
const ALLOWED_CHANNEL_ID = "1469340654696927458";

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
  .filter(f => f.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  if (command?.data && command?.execute) {
    client.commands.set(command.data.name, command);
  }
}

/* =======================
   READY
======================= */
client.once("clientReady", () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`);
});

/* =======================
   INTERACTIONS
======================= */
client.on("interactionCreate", async interaction => {
  try {
    /* =====================
       AUTOCOMPLETE (SAFE)
    ===================== */
    if (interaction.isAutocomplete()) {
      const command = client.commands.get(interaction.commandName);
      if (!command?.autocomplete) return;

      try {
        await command.autocomplete(interaction);
      } catch {
        // silence total (autocomplete expire très vite)
      }
      return;
    }

    /* =====================
       BOUTONS / SELECT
    ===================== */
    if (interaction.isButton() || interaction.isStringSelectMenu()) {

      // ACK SAFE
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferUpdate().catch(() => {});
      }

      if (interaction.customId.startsWith("addons_")) {
        return handleAddons(interaction).catch(() => {});
      }

      if (interaction.customId.startsWith("perk_")) {
        return handlePerks(interaction).catch(() => {});
      }

      if (interaction.customId.startsWith("build_")) {
        const [, action, camp, category] =
          interaction.customId.split("_");

        if (action !== "reroll") return;

        const build = generateBuild(perksData, camp, category);
        if (!build?.length) return;

        const embed = EmbedBuilder.from(
          interaction.message.embeds[0]
        );

        embed.spliceFields(0, 1, {
          name: "Perks",
          value: build.map(p => `• **${p.name}**`).join("\n")
        });

        return interaction.editReply({ embeds: [embed] }).catch(() => {});
      }

      return;
    }

    /* =====================
       SLASH COMMAND
    ===================== */
    if (!interaction.isChatInputCommand()) return;

    /* 🚫 BLOQUAGE SALON */
    if (interaction.channelId !== ALLOWED_CHANNEL_ID) {
      return interaction.reply({
        content: "❌ Les commandes sont autorisées uniquement dans le salon prévu.",
        flags: MessageFlags.Ephemeral
      }).catch(() => {});
    }

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    /* ✅ DEFER CENTRALISÉ UNIQUE */
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferReply().catch(() => {});
    }

    await command.execute(interaction);

  } catch (error) {
    console.error("❌ Erreur interaction :", error);

    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: "❌ Une erreur est survenue.",
        flags: MessageFlags.Ephemeral
      }).catch(() => {});
    }
  }
});

/* =======================
   LOGIN
======================= */
client.login(process.env.TOKEN);
