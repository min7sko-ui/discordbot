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
import { FeedbackManager } from '../utils/feedbackManager.js';
import chalk from 'chalk';

export const data = new SlashCommandBuilder()
  .setName('close')
  .setDescription('Close the current ticket')
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
      content: '⌛ Closing ticket and generating transcript...',
      ephemeral: true,
    });

    const config = ConfigHandler.getConfig();
    const channel = interaction.channel as TextChannel;

    const transcriptPath = await TranscriptGenerator.generateHTMLTranscript(
      channel,
      ticket.ticketId
    );

    if (transcriptPath) {
      const transcriptChannel = await interaction.guild?.channels.fetch(
        config.transcript_channel_id
      ) as TextChannel;

      if (transcriptChannel) {
        const embed = new EmbedBuilder()
          .setTitle(`📜 Ticket Transcript: ${ticket.ticketId}`)
          .setDescription(
            `**User:** <@${ticket.data.userId}>\n**Category:** ${ticket.data.category}\n**Closed by:** ${interaction.user}\n**Created:** ${new Date(ticket.data.createdAt).toLocaleString()}`
          )
          .setColor(config.embed_color)
          .setFooter({ text: config.footer_text })
          .setTimestamp();

        await transcriptChannel.send({
          embeds: [embed],
          files: [transcriptPath],
        });
      }
    }

    const user = await interaction.client.users.fetch(ticket.data.userId);
    await FeedbackManager.sendFeedbackPrompt(user, ticket.ticketId);

    TicketManager.closeTicket(ticket.ticketId);

    const closeEmbed = new EmbedBuilder()
      .setTitle('🔒 Ticket Closed')
      .setDescription(
        config.close_ticket_message.replace('{user}', interaction.user.toString())
      )
      .setColor(config.embed_color)
      .setFooter({ text: config.footer_text })
      .setTimestamp();

    await channel.send({ embeds: [closeEmbed] });

    setTimeout(async () => {
      try {
        await channel.delete();
        console.log(chalk.green(`✅ Ticket channel ${ticket.ticketId} deleted`));
      } catch (error) {
        console.error(chalk.red('❌ Error deleting ticket channel:'), error);
      }
    }, 5000);
  } catch (error) {
    console.error(chalk.red('❌ Error in close command:'), error);
    await interaction.followUp({
      content: '❌ An error occurred while closing the ticket.',
      ephemeral: true,
    });
  }
}
