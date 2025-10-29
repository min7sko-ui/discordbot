import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from 'discord.js';
import { ConfigHandler } from '../utils/configHandler.js';
import { Lang } from '../utils/languageManager.js';

export const data = new SlashCommandBuilder()
  .setName('settings')
  .setDescription('Configure ticket system settings')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    const config = ConfigHandler.getConfig();

    const embed = new EmbedBuilder()
      .setTitle(Lang.t('settings.title'))
      .setDescription(Lang.t('settings.menu_description'))
      .setColor(config.embed_color)
      .addFields(
        {
          name: '🤖 AI Responses',
          value: config.features.ai_responses ? '✅ Enabled' : '❌ Disabled',
          inline: true,
        },
        {
          name: '🔒 Auto-Close',
          value: config.features.auto_close ? '✅ Enabled' : '❌ Disabled',
          inline: true,
        },
        {
          name: '⏰ Working Hours',
          value: config.features.working_hours ? '✅ Enabled' : '❌ Disabled',
          inline: true,
        },
        {
          name: '⭐ Ticket Reviews',
          value: config.features.ticket_reviews ? '✅ Enabled' : '❌ Disabled',
          inline: true,
        },
        {
          name: '📄 Transcripts',
          value: config.features.transcripts ? '✅ Enabled' : '❌ Disabled',
          inline: true,
        },
        {
          name: '🧩 Addons',
          value: config.features.addons ? '✅ Enabled' : '❌ Disabled',
          inline: true,
        },
        {
          name: '⏱️ Inactivity Timeout',
          value: `${config.automation.inactivity_timeout} minutes`,
          inline: true,
        },
        {
          name: '⚠️ Inactivity Warning',
          value: `${config.automation.inactivity_warning} minutes`,
          inline: true,
        },
        {
          name: '📊 Ticket Limit Per User',
          value: config.automation.max_tickets_per_user.toString(),
          inline: true,
        }
      )
      .setFooter({ text: config.footer_text })
      .setTimestamp();

    const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('toggle_ai')
        .setLabel('Toggle AI')
        .setEmoji('🤖')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('toggle_autoclose')
        .setLabel('Toggle Auto-Close')
        .setEmoji('🔒')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('toggle_reviews')
        .setLabel('Toggle Reviews')
        .setEmoji('⭐')
        .setStyle(ButtonStyle.Primary)
    );

    const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('reload_config')
        .setLabel('Reload Config')
        .setEmoji('🔄')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('view_tags')
        .setLabel('View Tags')
        .setEmoji('🏷️')
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({
      embeds: [embed],
      components: [row1, row2],
      ephemeral: true,
    });
  } catch (error) {
    console.error('Error in settings command:', error);
    await interaction.reply({
      content: Lang.t('general.error'),
      ephemeral: true,
    });
  }
}
