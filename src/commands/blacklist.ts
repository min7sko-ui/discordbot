import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
} from 'discord.js';
import { ConfigHandler } from '../utils/configHandler.js';
import { BlacklistManager } from '../utils/blacklistManager.js';
import chalk from 'chalk';

export const data = new SlashCommandBuilder()
  .setName('blacklist')
  .setDescription('Manage ticket blacklist')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
  .addSubcommand((subcommand) =>
    subcommand
      .setName('add')
      .setDescription('Add a user to the blacklist')
      .addUserOption((option) =>
        option.setName('user').setDescription('User to blacklist').setRequired(true)
      )
      .addStringOption((option) =>
        option.setName('reason').setDescription('Reason for blacklist').setRequired(false)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName('remove')
      .setDescription('Remove a user from the blacklist')
      .addUserOption((option) =>
        option.setName('user').setDescription('User to remove').setRequired(true)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand.setName('list').setDescription('List all blacklisted users')
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    const config = ConfigHandler.getConfig();
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'add') {
      const user = interaction.options.getUser('user', true);
      const reason = interaction.options.getString('reason') || 'No reason provided';

      BlacklistManager.addUser(user, reason);

      const embed = new EmbedBuilder()
        .setTitle('✅ User Blacklisted')
        .setDescription(`**User:** ${user}\n**Reason:** ${reason}`)
        .setColor(config.embed_color)
        .setFooter({ text: config.footer_text })
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });
      console.log(chalk.green(`✅ ${user.tag} blacklisted by ${interaction.user.tag}`));
    } else if (subcommand === 'remove') {
      const user = interaction.options.getUser('user', true);
      const removed = BlacklistManager.removeUser(user.id);

      if (removed) {
        const embed = new EmbedBuilder()
          .setTitle('✅ User Removed from Blacklist')
          .setDescription(`**User:** ${user}`)
          .setColor(config.embed_color)
          .setFooter({ text: config.footer_text })
          .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
        console.log(chalk.green(`✅ ${user.tag} removed from blacklist by ${interaction.user.tag}`));
      } else {
        await interaction.reply({
          content: '❌ User is not blacklisted.',
          ephemeral: true,
        });
      }
    } else if (subcommand === 'list') {
      const blacklist = BlacklistManager.getBlacklist();
      const entries = Object.values(blacklist);

      if (entries.length === 0) {
        await interaction.reply({
          content: '📋 The blacklist is empty.',
          ephemeral: true,
        });
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle('📋 Blacklisted Users')
        .setDescription(
          entries
            .map(
              (entry, index) =>
                `**${index + 1}.** <@${entry.userId}> (${entry.userName})\n` +
                `   **Reason:** ${entry.reason}\n` +
                `   **Date:** ${new Date(entry.timestamp).toLocaleString()}`
            )
            .join('\n\n')
        )
        .setColor(config.embed_color)
        .setFooter({ text: config.footer_text })
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  } catch (error) {
    console.error(chalk.red('❌ Error in blacklist command:'), error);
    await interaction.reply({
      content: '❌ An error occurred while processing the command.',
      ephemeral: true,
    });
  }
}
