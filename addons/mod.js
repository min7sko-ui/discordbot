// Moderator Toolkit Addon for Advanced Ticket Bot
// Place this file in the /addons directory

import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ChannelType,
} from "discord.js";
import fs from "fs";

export default {
  name: "Moderator Toolkit",
  version: "1.0.0",
  description: "Comprehensive moderation commands with case tracking",
  author: "Your Name",

  interactionHandler: null,
  cases: new Map(), // Store moderation cases in memory
  caseCounter: 1,

  // Load cases from file
  loadCases() {
    try {
      if (fs.existsSync("./mod_cases.json")) {
        const data = JSON.parse(fs.readFileSync("./mod_cases.json", "utf8"));
        this.cases = new Map(data.cases);
        this.caseCounter = data.counter || 1;
        console.log(`📋 Loaded ${this.cases.size} moderation cases`);
      }
    } catch (error) {
      console.error("Error loading cases:", error);
    }
  },

  // Save cases to file
  saveCases() {
    try {
      const data = {
        cases: Array.from(this.cases.entries()),
        counter: this.caseCounter,
      };
      fs.writeFileSync("./mod_cases.json", JSON.stringify(data, null, 2));
    } catch (error) {
      console.error("Error saving cases:", error);
    }
  },

  // Create a new moderation case
  createCase(type, moderator, target, reason, duration = null) {
    const caseId = `CASE-${String(this.caseCounter).padStart(6, "0")}`;
    const caseData = {
      id: caseId,
      type,
      moderator: {
        id: moderator.id,
        tag: moderator.tag,
      },
      target: {
        id: target.id,
        tag: target.tag,
      },
      reason: reason || "No reason provided",
      duration,
      timestamp: new Date().toISOString(),
    };

    this.cases.set(caseId, caseData);
    this.caseCounter++;
    this.saveCases();

    return caseData;
  },

  async onLoad(client) {
    console.log("Moderator Toolkit addon loaded!");

    // Load existing cases
    this.loadCases();

    if (!client.isReady()) {
      await new Promise((resolve) => client.once("ready", resolve));
    }

    // Read guild ID from config
    let guildId = null;
    try {
      const configFile = fs.readFileSync("./config.yml", "utf8");
      const guildIdMatch = configFile.match(
        /(?:guildId|guild_id|GUILD_ID):\s*['"]?(\d+)['"]?/i,
      );
      if (guildIdMatch) {
        guildId = guildIdMatch[1];
      }
    } catch (error) {
      console.warn("⚠️ Could not read config.yml");
    }

    // Define all commands
    const commands = [
      // Clear command
      new SlashCommandBuilder()
        .setName("clear")
        .setDescription("Delete multiple messages from the channel")
        .addIntegerOption((option) =>
          option
            .setName("amount")
            .setDescription("Number of messages to delete (1-100)")
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(100),
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

      // Lock command
      new SlashCommandBuilder()
        .setName("lock")
        .setDescription("Lock the channel for regular users")
        .addStringOption((option) =>
          option
            .setName("reason")
            .setDescription("Reason for locking")
            .setRequired(false),
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

      // Unlock command
      new SlashCommandBuilder()
        .setName("unlock")
        .setDescription("Unlock the channel")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

      // Slowmode command
      new SlashCommandBuilder()
        .setName("slowmode")
        .setDescription("Set slowmode for the channel")
        .addIntegerOption((option) =>
          option
            .setName("seconds")
            .setDescription("Slowmode duration in seconds (0 to disable)")
            .setRequired(true)
            .setMinValue(0)
            .setMaxValue(21600),
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

      // Userinfo command
      new SlashCommandBuilder()
        .setName("userinfo")
        .setDescription("Display information about a user")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The user to get info about")
            .setRequired(false),
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

      // Case command
      new SlashCommandBuilder()
        .setName("case")
        .setDescription("View details of a moderation case")
        .addStringOption((option) =>
          option
            .setName("id")
            .setDescription("Case ID (e.g., CASE-000001)")
            .setRequired(true),
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

      // Warn command
      new SlashCommandBuilder()
        .setName("warn")
        .setDescription("Warn a user")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("User to warn")
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("reason")
            .setDescription("Reason for warning")
            .setRequired(false),
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

      // Mute command
      new SlashCommandBuilder()
        .setName("mute")
        .setDescription("Timeout a user")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("User to mute")
            .setRequired(true),
        )
        .addIntegerOption((option) =>
          option
            .setName("duration")
            .setDescription("Duration in minutes")
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(40320),
        )
        .addStringOption((option) =>
          option
            .setName("reason")
            .setDescription("Reason for mute")
            .setRequired(false),
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    ];

    // Register commands
    try {
      if (guildId) {
        const guild = client.guilds.cache.get(guildId);
        if (guild) {
          for (const command of commands) {
            await guild.commands.create(command);
          }
          console.log("✅ Moderator Toolkit commands registered to guild!");
        }
      } else {
        for (const command of commands) {
          await client.application.commands.create(command);
        }
        console.log("✅ Moderator Toolkit commands registered globally!");
      }
    } catch (error) {
      console.error("❌ Failed to register commands:", error);
    }

    // Command handler
    this.interactionHandler = async (interaction) => {
      if (!interaction.isChatInputCommand()) return;

      try {
        // Clear command
        if (interaction.commandName === "clear") {
          const amount = interaction.options.getInteger("amount");
          const messages = await interaction.channel.messages.fetch({
            limit: amount,
          });
          await interaction.channel.bulkDelete(messages, true);

          const caseData = this.createCase(
            "CLEAR",
            interaction.user,
            interaction.user,
            `Cleared ${messages.size} messages`,
          );

          await interaction.reply({
            content: `🗑️ Deleted ${messages.size} messages | Case: ${caseData.id}`,
            ephemeral: true,
          });
        }

        // Lock command
        else if (interaction.commandName === "lock") {
          const reason =
            interaction.options.getString("reason") || "No reason provided";
          await interaction.channel.permissionOverwrites.edit(
            interaction.guild.roles.everyone,
            {
              SendMessages: false,
            },
          );

          const caseData = this.createCase(
            "LOCK",
            interaction.user,
            interaction.user,
            reason,
          );

          const embed = new EmbedBuilder()
            .setColor("#ff0000")
            .setTitle("🔒 Channel Locked")
            .setDescription(
              `This channel has been locked by ${interaction.user}`,
            )
            .addFields({ name: "Reason", value: reason })
            .addFields({ name: "Case ID", value: caseData.id })
            .setTimestamp();

          await interaction.reply({ embeds: [embed] });
        }

        // Unlock command
        else if (interaction.commandName === "unlock") {
          await interaction.channel.permissionOverwrites.edit(
            interaction.guild.roles.everyone,
            {
              SendMessages: null,
            },
          );

          const caseData = this.createCase(
            "UNLOCK",
            interaction.user,
            interaction.user,
            "Channel unlocked",
          );

          const embed = new EmbedBuilder()
            .setColor("#00ff00")
            .setTitle("🔓 Channel Unlocked")
            .setDescription(
              `This channel has been unlocked by ${interaction.user}`,
            )
            .addFields({ name: "Case ID", value: caseData.id })
            .setTimestamp();

          await interaction.reply({ embeds: [embed] });
        }

        // Slowmode command
        else if (interaction.commandName === "slowmode") {
          const seconds = interaction.options.getInteger("seconds");
          await interaction.channel.setRateLimitPerUser(seconds);

          const caseData = this.createCase(
            "SLOWMODE",
            interaction.user,
            interaction.user,
            `Set slowmode to ${seconds}s`,
          );

          const message =
            seconds === 0
              ? "⏱️ Slowmode disabled"
              : `⏱️ Slowmode set to ${seconds} seconds`;

          await interaction.reply({
            content: `${message} | Case: ${caseData.id}`,
            ephemeral: true,
          });
        }

        // Userinfo command
        else if (interaction.commandName === "userinfo") {
          const user = interaction.options.getUser("user") || interaction.user;
          const member = await interaction.guild.members.fetch(user.id);

          // Count user's cases
          const userCases = Array.from(this.cases.values()).filter(
            (c) => c.target.id === user.id,
          );
          const warnings = userCases.filter((c) => c.type === "WARN").length;
          const mutes = userCases.filter((c) => c.type === "MUTE").length;

          const embed = new EmbedBuilder()
            .setColor("#0099ff")
            .setTitle(`User Information: ${user.tag}`)
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .addFields(
              { name: "👤 User ID", value: user.id, inline: true },
              {
                name: "📅 Account Created",
                value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`,
                inline: true,
              },
              {
                name: "📥 Joined Server",
                value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`,
                inline: true,
              },
              {
                name: "🎭 Roles",
                value:
                  member.roles.cache
                    .map((r) => r.name)
                    .filter((n) => n !== "@everyone")
                    .join(", ") || "None",
                inline: false,
              },
              { name: "⚠️ Warnings", value: warnings.toString(), inline: true },
              { name: "🔇 Mutes", value: mutes.toString(), inline: true },
              {
                name: "🔇 Currently Muted",
                value: member.communicationDisabledUntil ? "Yes" : "No",
                inline: true,
              },
            )
            .setTimestamp();

          await interaction.reply({ embeds: [embed] });
        }

        // Case command
        else if (interaction.commandName === "case") {
          const caseId = interaction.options.getString("id").toUpperCase();
          const caseData = this.cases.get(caseId);

          if (!caseData) {
            return await interaction.reply({
              content: "❌ Case not found!",
              ephemeral: true,
            });
          }

          const embed = new EmbedBuilder()
            .setColor("#ffa500")
            .setTitle(`📋 Case ${caseData.id}`)
            .addFields(
              { name: "Type", value: caseData.type, inline: true },
              {
                name: "Moderator",
                value: `${caseData.moderator.tag} (${caseData.moderator.id})`,
                inline: true,
              },
              {
                name: "Target",
                value: `${caseData.target.tag} (${caseData.target.id})`,
                inline: true,
              },
              { name: "Reason", value: caseData.reason, inline: false },
              {
                name: "Timestamp",
                value: `<t:${Math.floor(new Date(caseData.timestamp).getTime() / 1000)}:F>`,
                inline: false,
              },
            );

          if (caseData.duration) {
            embed.addFields({
              name: "Duration",
              value: `${caseData.duration} minutes`,
              inline: true,
            });
          }

          await interaction.reply({ embeds: [embed] });
        }

        // Warn command
        else if (interaction.commandName === "warn") {
          const user = interaction.options.getUser("user");
          const reason =
            interaction.options.getString("reason") || "No reason provided";

          const caseData = this.createCase(
            "WARN",
            interaction.user,
            user,
            reason,
          );

          const embed = new EmbedBuilder()
            .setColor("#ffff00")
            .setTitle("⚠️ User Warned")
            .addFields(
              { name: "User", value: `${user.tag} (${user.id})`, inline: true },
              { name: "Moderator", value: interaction.user.tag, inline: true },
              { name: "Case ID", value: caseData.id, inline: true },
              { name: "Reason", value: reason, inline: false },
            )
            .setTimestamp();

          await interaction.reply({ embeds: [embed] });

          // Try to DM user
          try {
            await user.send(
              `You have been warned in ${interaction.guild.name}\nReason: ${reason}\nCase: ${caseData.id}`,
            );
          } catch (error) {
            console.log("Could not DM user");
          }
        }

        // Mute command
        else if (interaction.commandName === "mute") {
          const user = interaction.options.getUser("user");
          const duration = interaction.options.getInteger("duration");
          const reason =
            interaction.options.getString("reason") || "No reason provided";
          const member = await interaction.guild.members.fetch(user.id);

          await member.timeout(duration * 60 * 1000, reason);

          const caseData = this.createCase(
            "MUTE",
            interaction.user,
            user,
            reason,
            duration,
          );

          const embed = new EmbedBuilder()
            .setColor("#ff6600")
            .setTitle("🔇 User Muted")
            .addFields(
              { name: "User", value: `${user.tag} (${user.id})`, inline: true },
              { name: "Duration", value: `${duration} minutes`, inline: true },
              { name: "Case ID", value: caseData.id, inline: true },
              { name: "Reason", value: reason, inline: false },
            )
            .setTimestamp();

          await interaction.reply({ embeds: [embed] });

          // Try to DM user
          try {
            await user.send(
              `You have been muted in ${interaction.guild.name} for ${duration} minutes\nReason: ${reason}\nCase: ${caseData.id}`,
            );
          } catch (error) {
            console.log("Could not DM user");
          }
        }
      } catch (error) {
        console.error("Command error:", error);
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: "❌ An error occurred while executing this command.",
            ephemeral: true,
          });
        }
      }
    };

    client.on("interactionCreate", this.interactionHandler);
  },

  async onUnload(client) {
    console.log("Moderator Toolkit addon unloaded!");

    if (this.interactionHandler) {
      client.off("interactionCreate", this.interactionHandler);
    }

    this.saveCases();
  },
};
