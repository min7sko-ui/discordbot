import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
} from 'discord.js';
import { TicketManager } from '../utils/ticketManager.js';
import { ConfigHandler } from '../utils/configHandler.js';
import { Lang } from '../utils/languageManager.js';
import chalk from 'chalk';

export const data = new SlashCommandBuilder()
  .setName('claim')
  .setDescription('Claim or unclaim a ticket')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
  .addSubcommand(subcommand =>
    subcommand
      .setName('ticket')
      .setDescription('Claim the current ticket')
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('unclaim')
      .setDescription('Unclaim the current ticket')
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

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'ticket') {
      if (ticket.data.claimedBy) {
        await interaction.reply({
          content: Lang.t('ticket_manage.already_claimed', {
            user: `<@${ticket.data.claimedBy}>`,
          }),
          ephemeral: true,
        });
        return;
      }

      const success = TicketManager.claimTicket(
        ticket.ticketId,
        interaction.user.id,
        interaction.user.username
      );

      if (success) {
        const embed = new EmbedBuilder()
          .setTitle('✋ Ticket Claimed')
          .setDescription(
            Lang.t('ticket_manage.claimed', { user: interaction.user.toString() })
          )
          .setColor(config.embed_color)
          .setFooter({ text: config.footer_text })
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        console.log(chalk.green(`✅ Ticket ${ticket.ticketId} claimed by ${interaction.user.tag}`));
      } else {
        await interaction.reply({
          content: Lang.t('general.error'),
          ephemeral: true,
        });
      }
    } else if (subcommand === 'unclaim') {
      if (!ticket.data.claimedBy) {
        await interaction.reply({
          content: '❌ This ticket is not claimed.',
          ephemeral: true,
        });
        return;
      }

      const success = TicketManager.unclaimTicket(ticket.ticketId);

      if (success) {
        const embed = new EmbedBuilder()
          .setTitle('👋 Ticket Unclaimed')
          .setDescription(Lang.t('ticket_manage.unclaimed'))
          .setColor(config.embed_color)
          .setFooter({ text: config.footer_text })
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        console.log(chalk.green(`✅ Ticket ${ticket.ticketId} unclaimed`));
      } else {
        await interaction.reply({
          content: Lang.t('general.error'),
          ephemeral: true,
        });
      }
    }
  } catch (error) {
    console.error(chalk.red('❌ Error in claim command:'), error);
    await interaction.reply({
      content: Lang.t('general.error'),
      ephemeral: true,
    });
  }
}
