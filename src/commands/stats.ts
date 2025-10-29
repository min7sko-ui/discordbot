import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
} from 'discord.js';
import { StatsManager } from '../utils/statsManager.js';
import { ConfigHandler } from '../utils/configHandler.js';
import { Lang } from '../utils/languageManager.js';

export const data = new SlashCommandBuilder()
  .setName('stats')
  .setDescription('View support ticket statistics')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    await interaction.deferReply({ ephemeral: true });

    const config = ConfigHandler.getConfig();
    const stats = StatsManager.calculateStats();
    const topStaff = StatsManager.getTopStaff();
    const busiestCategory = StatsManager.getBusiestCategory();

    const embed = new EmbedBuilder()
      .setTitle(Lang.t('stats.title'))
      .setColor(config.embed_color)
      .addFields(
        {
          name: Lang.t('stats.total_tickets'),
          value: stats.totalTickets.toString(),
          inline: true,
        },
        {
          name: Lang.t('stats.open_tickets'),
          value: stats.openTickets.toString(),
          inline: true,
        },
        {
          name: Lang.t('stats.closed_tickets'),
          value: stats.closedTickets.toString(),
          inline: true,
        },
        {
          name: Lang.t('stats.avg_response_time'),
          value: `${stats.avgResponseTime} minutes`,
          inline: true,
        },
        {
          name: Lang.t('stats.avg_resolution_time'),
          value: `${stats.avgResolutionTime} hours`,
          inline: true,
        },
        {
          name: Lang.t('stats.avg_rating'),
          value: `${stats.avgRating}/5.0 ⭐`,
          inline: true,
        }
      )
      .setFooter({ text: config.footer_text })
      .setTimestamp();

    if (topStaff) {
      embed.addFields({
        name: Lang.t('stats.top_staff'),
        value: `${topStaff.username} (${topStaff.count} tickets)`,
        inline: false,
      });
    }

    if (busiestCategory) {
      embed.addFields({
        name: Lang.t('stats.busiest_category'),
        value: `${busiestCategory.category} (${busiestCategory.count} tickets)`,
        inline: false,
      });
    }

    // Rating distribution
    const ratingBars = Object.entries(stats.ratingDistribution)
      .map(([rating, count]) => {
        const percentage = stats.totalTickets > 0 ? (count / stats.totalTickets) * 100 : 0;
        const barLength = Math.floor(percentage / 5);
        const bar = '█'.repeat(barLength) + '░'.repeat(20 - barLength);
        return `${rating}⭐ ${bar} ${count}`;
      })
      .reverse()
      .join('\n');

    if (ratingBars) {
      embed.addFields({
        name: '📊 Rating Distribution',
        value: `\`\`\`${ratingBars}\`\`\``,
        inline: false,
      });
    }

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Error in stats command:', error);
    await interaction.editReply({
      content: Lang.t('general.error'),
    });
  }
}
