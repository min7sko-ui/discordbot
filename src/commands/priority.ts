import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
} from 'discord.js';
import { TicketManager } from '../utils/ticketManager.js';
import { ConfigHandler } from '../utils/configHandler.js';
import { Lang } from '../utils/languageManager.js';
import { TicketPriority } from '../types/index.js';
import chalk from 'chalk';

export const data = new SlashCommandBuilder()
  .setName('priority')
  .setDescription('Set ticket priority level')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
  .addStringOption(option =>
    option
      .setName('level')
      .setDescription('Priority level')
      .setRequired(true)
      .addChoices(
        { name: '🟢 Low', value: 'low' },
        { name: '🟡 Medium', value: 'medium' },
        { name: '🟠 High', value: 'high' },
        { name: '🔴 Urgent', value: 'urgent' }
      )
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    const config = ConfigHandler.getConfig();
    const ticket = TicketManager.getTicketByChannel(interaction.channelId);

    if (!ticket) {
      await interaction.reply({
        content: Lang.t('general.invalid_ticket'),
        ephemeral: true,
      });
      return;
    }

    const level = interaction.options.getString('level', true) as TicketPriority;

    const success = TicketManager.setPriority(
      ticket.ticketId,
      level,
      interaction.user.id,
      interaction.user.username
    );

    if (success) {
      const priorityDisplay = TicketManager.getPriorityDisplay(level);
      const priorityColor = TicketManager.getPriorityColor(level);

      const embed = new EmbedBuilder()
        .setTitle('🎯 Priority Updated')
        .setDescription(Lang.t('priority.set', { priority: priorityDisplay }))
        .setColor(priorityColor)
        .setFooter({ text: config.footer_text })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
      console.log(chalk.green(`✅ Ticket ${ticket.ticketId} priority set to ${level}`));
    } else {
      await interaction.reply({
        content: Lang.t('general.error'),
        ephemeral: true,
      });
    }
  } catch (error) {
    console.error(chalk.red('❌ Error in priority command:'), error);
    await interaction.reply({
      content: Lang.t('general.error'),
      ephemeral: true,
    });
  }
}
