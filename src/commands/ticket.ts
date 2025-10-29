import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from 'discord.js';
import { ConfigHandler } from '../utils/configHandler.js';
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
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  try {
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
    }
  } catch (error) {
    console.error(chalk.red('❌ Error in ticket panel command:'), error);
    await interaction.reply({
      content: '❌ An error occurred while processing the command.',
      ephemeral: true,
    });
  }
}
