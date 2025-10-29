import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
} from 'discord.js';
import { Logger } from '../utils/logger.js';
import { ConfigHandler } from '../utils/configHandler.js';
import { format } from 'date-fns';

export const data = new SlashCommandBuilder()
  .setName('logs')
  .setDescription('View recent ticket logs')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addIntegerOption(option =>
    option
      .setName('limit')
      .setDescription('Number of logs to show (default: 10)')
      .setMinValue(1)
      .setMaxValue(50)
      .setRequired(false)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    await interaction.deferReply({ ephemeral: true });

    const limit = interaction.options.getInteger('limit') || 10;
    const config = ConfigHandler.getConfig();
    const recentLogs = Logger.getRecentLogs(limit);

    if (recentLogs.length === 0) {
      await interaction.editReply({
        content: 'No recent logs found.',
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle('📋 Recent Ticket Logs')
      .setDescription(
        recentLogs
          .map(log => {
            const timestamp = format(new Date(log.timestamp), 'MMM dd HH:mm');
            return `\`${timestamp}\` **${log.type}** - ${log.username}: ${log.details}`;
          })
          .join('\n')
      )
      .setColor(config.embed_color)
      .setFooter({ text: config.footer_text })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Error in logs command:', error);
    await interaction.editReply({
      content: '❌ An error occurred while fetching logs.',
    });
  }
}
