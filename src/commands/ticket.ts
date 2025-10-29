import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  TextChannel,
} from 'discord.js';
import { ConfigHandler } from '../utils/configHandler.js';
import { TicketManager } from '../utils/ticketManager.js';
import chalk from 'chalk';

export const data = new SlashCommandBuilder()
  .setName('ticket')
  .setDescription('Manage ticket panels')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
  .addSubcommand((subcommand) =>
    subcommand
      .setName('panel')
      .setDescription('Send a ticket panel')
      .addIntegerOption((option) =>
        option
          .setName('number')
          .setDescription('Panel number to send')
          .setRequired(true)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName('add')
      .setDescription('Add a member to the current ticket')
      .addUserOption((option) =>
        option
          .setName('user')
          .setDescription('User to add to the ticket')
          .setRequired(true)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName('remove')
      .setDescription('Remove a member from the current ticket')
      .addUserOption((option) =>
        option
          .setName('user')
          .setDescription('User to remove from the ticket')
          .setRequired(true)
      )
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    const config = ConfigHandler.getConfig();
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'panel') {
      const panelNumber = interaction.options.getInteger('number', true);
      const panels = ConfigHandler.getPanels();
      const panel = panels.panels[panelNumber];

      if (!panel) {
        await interaction.reply({
          content: `❌ Panel ${panelNumber} not found in ticket-panels.yml`,
          ephemeral: true,
        });
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle(panel.title)
        .setDescription(panel.description)
        .setColor(panel.color)
        .setFooter({ text: panel.footer })
        .setTimestamp();

      const options = panel.categories.map((category, index) =>
        new StringSelectMenuOptionBuilder()
          .setLabel(category.label)
          .setDescription(category.description)
          .setEmoji(category.emoji)
          .setValue(`ticket_category_${panelNumber}_${index}`)
      );

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(`ticket_panel_${panelNumber}`)
        .setPlaceholder('Select a category...')
        .addOptions(options);

      const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

      await interaction.channel?.send({
        embeds: [embed],
        components: [row],
      });

      await interaction.reply({
        content: '✅ Ticket panel sent successfully!',
        ephemeral: true,
      });

      console.log(chalk.green(`✅ Panel ${panelNumber} sent by ${interaction.user.tag}`));
    } else if (subcommand === 'add') {
      const ticket = TicketManager.getTicketByChannel(interaction.channelId);

      if (!ticket) {
        await interaction.reply({
          content: '❌ This channel is not a ticket.',
          ephemeral: true,
        });
        return;
      }

      const user = interaction.options.getUser('user', true);
      const channel = interaction.channel as TextChannel;

      await channel.permissionOverwrites.create(user.id, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true,
      });

      const embed = new EmbedBuilder()
        .setTitle('✅ Member Added')
        .setDescription(`${user} has been added to this ticket.`)
        .setColor(config.embed_color)
        .setFooter({ text: config.footer_text })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
      console.log(chalk.green(`✅ ${user.tag} added to ${ticket.ticketId} by ${interaction.user.tag}`));
    } else if (subcommand === 'remove') {
      const ticket = TicketManager.getTicketByChannel(interaction.channelId);

      if (!ticket) {
        await interaction.reply({
          content: '❌ This channel is not a ticket.',
          ephemeral: true,
        });
        return;
      }

      const user = interaction.options.getUser('user', true);

      if (user.id === ticket.data.userId) {
        await interaction.reply({
          content: '❌ You cannot remove the ticket owner.',
          ephemeral: true,
        });
        return;
      }

      const channel = interaction.channel as TextChannel;

      await channel.permissionOverwrites.delete(user.id);

      const embed = new EmbedBuilder()
        .setTitle('✅ Member Removed')
        .setDescription(`${user} has been removed from this ticket.`)
        .setColor(config.embed_color)
        .setFooter({ text: config.footer_text })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
      console.log(chalk.green(`✅ ${user.tag} removed from ${ticket.ticketId} by ${interaction.user.tag}`));
    }
  } catch (error) {
    console.error(chalk.red('❌ Error in ticket command:'), error);
    await interaction.reply({
      content: '❌ An error occurred while processing the command.',
      ephemeral: true,
    });
  }
}
