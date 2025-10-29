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
  .setName('tag')
  .setDescription('Manage ticket tags')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
  .addSubcommand(subcommand =>
    subcommand
      .setName('add')
      .setDescription('Add a tag to the ticket')
      .addStringOption(option =>
        option
          .setName('tag')
          .setDescription('Tag to add')
          .setRequired(true)
          .setAutocomplete(true)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('remove')
      .setDescription('Remove a tag from the ticket')
      .addStringOption(option =>
        option
          .setName('tag')
          .setDescription('Tag to remove')
          .setRequired(true)
          .setAutocomplete(true)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('list')
      .setDescription('List all tags on this ticket')
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

    if (subcommand === 'add') {
      const tag = interaction.options.getString('tag', true);

      const success = TicketManager.addTag(
        ticket.ticketId,
        tag,
        interaction.user.id,
        interaction.user.username
      );

      if (success) {
        const embed = new EmbedBuilder()
          .setTitle('🏷️ Tag Added')
          .setDescription(Lang.t('tags.added', { tag }))
          .setColor(config.embed_color)
          .setFooter({ text: config.footer_text })
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        console.log(chalk.green(`✅ Tag "${tag}" added to ${ticket.ticketId}`));
      } else {
        await interaction.reply({
          content: '❌ Tag already exists or could not be added.',
          ephemeral: true,
        });
      }
    } else if (subcommand === 'remove') {
      const tag = interaction.options.getString('tag', true);

      const success = TicketManager.removeTag(
        ticket.ticketId,
        tag,
        interaction.user.id,
        interaction.user.username
      );

      if (success) {
        const embed = new EmbedBuilder()
          .setTitle('🏷️ Tag Removed')
          .setDescription(Lang.t('tags.removed', { tag }))
          .setColor(config.embed_color)
          .setFooter({ text: config.footer_text })
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        console.log(chalk.green(`✅ Tag "${tag}" removed from ${ticket.ticketId}`));
      } else {
        await interaction.reply({
          content: '❌ Tag not found or could not be removed.',
          ephemeral: true,
        });
      }
    } else if (subcommand === 'list') {
      const tags = ticket.data.tags;

      const embed = new EmbedBuilder()
        .setTitle('🏷️ Ticket Tags')
        .setDescription(
          tags.length > 0
            ? Lang.t('tags.list', { tags: tags.join(', ') })
            : Lang.t('tags.none')
        )
        .setColor(config.embed_color)
        .setFooter({ text: config.footer_text })
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  } catch (error) {
    console.error(chalk.red('❌ Error in tag command:'), error);
    await interaction.reply({
      content: Lang.t('general.error'),
      ephemeral: true,
    });
  }
}
