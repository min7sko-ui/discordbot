import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
  TextChannel,
} from 'discord.js';
import { ConfigHandler } from '../utils/configHandler.js';
import { TicketManager } from '../utils/ticketManager.js';
import { TranscriptGenerator } from '../utils/transcriptGenerator.js';
import chalk from 'chalk';

export const data = new SlashCommandBuilder()
  .setName('transcript')
  .setDescription('Generate a transcript for the current ticket')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels);

export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    const ticket = TicketManager.getTicketByChannel(interaction.channelId);

    if (!ticket) {
      await interaction.reply({
        content: '❌ This channel is not a ticket.',
        ephemeral: true,
      });
      return;
    }

    await interaction.reply({
      content: '⌛ Generating transcript...',
      ephemeral: true,
    });

    const config = ConfigHandler.getConfig();
    const channel = interaction.channel as TextChannel;

    const htmlPath = await TranscriptGenerator.generateHTMLTranscript(
      channel,
      ticket.ticketId
    );
    const txtPath = await TranscriptGenerator.generateTextTranscript(
      channel,
      ticket.ticketId
    );

    if (htmlPath || txtPath) {
      const files = [];
      if (htmlPath) files.push(htmlPath);
      if (txtPath) files.push(txtPath);

      const embed = new EmbedBuilder()
        .setTitle('📜 Transcript Generated')
        .setDescription(
          `**Ticket:** ${ticket.ticketId}\n**User:** <@${ticket.data.userId}>\n**Category:** ${ticket.data.category}`
        )
        .setColor(config.embed_color)
        .setFooter({ text: config.footer_text })
        .setTimestamp();

      await interaction.followUp({
        embeds: [embed],
        files: files,
        ephemeral: true,
      });

      console.log(chalk.green(`✅ Transcript generated for ${ticket.ticketId}`));
    } else {
      await interaction.followUp({
        content: '❌ Failed to generate transcript.',
        ephemeral: true,
      });
    }
  } catch (error) {
    console.error(chalk.red('❌ Error in transcript command:'), error);
    await interaction.followUp({
      content: '❌ An error occurred while generating the transcript.',
      ephemeral: true,
    });
  }
}
