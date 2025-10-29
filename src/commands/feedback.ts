import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
} from 'discord.js';
import { ConfigHandler } from '../utils/configHandler.js';
import { FeedbackManager } from '../utils/feedbackManager.js';
import chalk from 'chalk';

export const data = new SlashCommandBuilder()
  .setName('feedback')
  .setDescription('View all feedback received')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels);

export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    const config = ConfigHandler.getConfig();
    const allFeedback = FeedbackManager.getAllFeedback();

    if (allFeedback.length === 0) {
      await interaction.reply({
        content: '📊 No feedback has been received yet.',
        ephemeral: true,
      });
      return;
    }

    const recentFeedback = allFeedback.slice(-10).reverse();

    const avgRating =
      allFeedback.reduce((sum, f) => sum + f.rating, 0) / allFeedback.length;

    const embed = new EmbedBuilder()
      .setTitle('📊 Support Feedback Summary')
      .setDescription(
        `**Total Feedback:** ${allFeedback.length}\n` +
          `**Average Rating:** ${'⭐'.repeat(Math.round(avgRating))} (${avgRating.toFixed(1)}/5)\n\n` +
          `**Recent Feedback (Last 10):**\n\n` +
          recentFeedback
            .map(
              (f) =>
                `**${f.ticketId}** - <@${f.userId}>\n` +
                `${'⭐'.repeat(f.rating)} (${f.rating}/5) - ${new Date(f.timestamp).toLocaleDateString()}`
            )
            .join('\n\n')
      )
      .setColor(config.embed_color)
      .setFooter({ text: config.footer_text })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
    console.log(chalk.green(`✅ Feedback viewed by ${interaction.user.tag}`));
  } catch (error) {
    console.error(chalk.red('❌ Error in feedback command:'), error);
    await interaction.reply({
      content: '❌ An error occurred while fetching feedback.',
      ephemeral: true,
    });
  }
}
