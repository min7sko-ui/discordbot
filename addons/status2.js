// Bot Status Command Addon for Advanced Ticket Bot
// Place this file in the /addons directory

import { SlashCommandBuilder, ActivityType } from "discord.js";
import fs from "fs";
import yaml from "yaml";

export default {
  name: "Bot Status Command",
  version: "1.0.0",
  description: "Adds a /status command to change bot status and activity",
  author: "Your Name",

  // Store the interaction handler so we can remove it later
  interactionHandler: null,

  // Called when addon is loaded
  async onLoad(client) {
    console.log("Bot Status Command addon loaded!");

    // Wait for bot to be ready
    if (!client.isReady()) {
      await new Promise((resolve) => client.once("ready", resolve));
    }

    // Read guild ID from config.yml
    let guildId = null;
    try {
      const configFile = fs.readFileSync("./config.yml", "utf8");
      const config = yaml.parse(configFile);
      guildId = config.guildId || config.guild_id || config.GUILD_ID;
      console.log(`📝 Guild ID from config: ${guildId}`);
    } catch (error) {
      console.warn(
        "⚠️ Could not read guild ID from config.yml:",
        error.message,
      );
    }

    // Register the slash command
    const statusCommand = new SlashCommandBuilder()
      .setName("status")
      .setDescription("Change the bot's status and activity")
      .addStringOption((option) =>
        option
          .setName("status")
          .setDescription("The status type")
          .setRequired(true)
          .addChoices(
            { name: "Online", value: "online" },
            { name: "Idle", value: "idle" },
            { name: "Do Not Disturb", value: "dnd" },
            { name: "Invisible", value: "invisible" },
          ),
      )
      .addStringOption((option) =>
        option
          .setName("activity")
          .setDescription("The activity type")
          .setRequired(false)
          .addChoices(
            { name: "Playing", value: "playing" },
            { name: "Streaming", value: "streaming" },
            { name: "Listening", value: "listening" },
            { name: "Watching", value: "watching" },
            { name: "Competing", value: "competing" },
          ),
      )
      .addStringOption((option) =>
        option
          .setName("message")
          .setDescription("The status message (activity name)")
          .setRequired(false),
      );

    // Register command to guild for instant registration
    try {
      if (guildId) {
        const guild = client.guilds.cache.get(guildId);
        if (guild) {
          await guild.commands.create(statusCommand);
          console.log("✅ /status command registered to guild instantly!");
        } else {
          console.error(
            "❌ Guild not found. Make sure the bot is in the server.",
          );
        }
      } else {
        // Fallback to global registration if no guild ID
        await client.application.commands.create(statusCommand);
        console.log(
          "✅ /status command registered globally (may take up to 1 hour to appear)",
        );
      }
    } catch (error) {
      console.error("❌ Failed to register /status command:", error);
    }

    // Store the handler so we can remove it later
    this.interactionHandler = async (interaction) => {
      if (!interaction.isChatInputCommand()) return;

      if (interaction.commandName === "status") {
        const status = interaction.options.getString("status");
        const activity = interaction.options.getString("activity");
        const message = interaction.options.getString("message");

        try {
          // Map activity strings to ActivityType
          const activityTypes = {
            playing: ActivityType.Playing,
            streaming: ActivityType.Streaming,
            listening: ActivityType.Listening,
            watching: ActivityType.Watching,
            competing: ActivityType.Competing,
          };

          // Set the presence
          const presenceOptions = {
            status: status,
          };

          // Only add activities if both activity type and message are provided
          if (activity && message) {
            presenceOptions.activities = [
              {
                name: message,
                type: activityTypes[activity],
              },
            ];
          }

          await client.user.setPresence(presenceOptions);

          // Build response message
          let responseMsg = `✅ Status changed to **${status}**`;
          if (activity && message) {
            responseMsg += `\n🎮 Activity: **${activity.charAt(0).toUpperCase() + activity.slice(1)}** ${message}`;
          }

          await interaction.reply({ content: responseMsg, ephemeral: true });
        } catch (error) {
          console.error("Error setting status:", error);
          await interaction.reply({
            content: "❌ Failed to change status. Please try again.",
            ephemeral: true,
          });
        }
      }
    };

    // Handle the command interaction
    client.on("interactionCreate", this.interactionHandler);
  },

  // Called when addon is unloaded
  async onUnload(client) {
    console.log("Bot Status Command addon unloaded!");

    // Remove event listener
    if (this.interactionHandler) {
      client.off("interactionCreate", this.interactionHandler);
    }

    // Optionally remove the command when unloading
    try {
      const commands = await client.application?.commands.fetch();
      const statusCommand = commands?.find((cmd) => cmd.name === "status");
      if (statusCommand) {
        await statusCommand.delete();
        console.log("✅ /status command removed");
      }
    } catch (error) {
      console.error("❌ Failed to remove /status command:", error);
    }
  },
};
