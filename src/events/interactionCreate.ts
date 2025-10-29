import {
  Interaction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  TextChannel,
  PermissionFlagsBits,
} from 'discord.js';
import { ConfigHandler } from '../utils/configHandler.js';
import { TicketManager } from '../utils/ticketManager.js';
import { BlacklistManager } from '../utils/blacklistManager.js';
import { FeedbackManager } from '../utils/feedbackManager.js';
import { TranscriptGenerator } from '../utils/transcriptGenerator.js';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';

export async function execute(interaction: Interaction) {
  try {
    if (interaction.isChatInputCommand()) {
      const commandsPath = path.join(process.cwd(), 'src', 'commands');
      const commandFile = `${interaction.commandName}.ts`;
      const filePath = path.join(commandsPath, commandFile);

      if (fs.existsSync(filePath)) {
        const command = await import(filePath);
        await command.execute(interaction);
      }
    } else if (interaction.isStringSelectMenu()) {
      if (interaction.customId.startsWith('ticket_panel_')) {
        await handleTicketPanelSelect(interaction);
      }
    } else if (interaction.isModalSubmit()) {
      if (interaction.customId.startsWith('ticket_modal_')) {
        await handleTicketModalSubmit(interaction);
      }
    } else if (interaction.isButton()) {
      await handleButtonInteraction(interaction);
    }
  } catch (error) {
    console.error(chalk.red('❌ Error in interactionCreate:'), error);
  }
}

async function handleTicketPanelSelect(interaction: any) {
  try {
    const config = ConfigHandler.getConfig();

    if (BlacklistManager.isBlacklisted(interaction.user.id)) {
      await interaction.reply({
        content: config.blacklist_message,
        ephemeral: true,
      });
      return;
    }

    const value = interaction.values[0];
    const [, , panelNumber, categoryIndex] = value.split('_');

    const panels = ConfigHandler.getPanels();
    const panel = panels.panels[parseInt(panelNumber)];
    const category = panel.categories[parseInt(categoryIndex)];

    const modal = new ModalBuilder()
      .setCustomId(`ticket_modal_${panelNumber}_${categoryIndex}`)
      .setTitle(category.modal.title);

    const components = category.modal.questions.map((question, index) => {
      const textInput = new TextInputBuilder()
        .setCustomId(`question_${index}`)
        .setLabel(question.label)
        .setStyle(
          question.style === 'paragraph' ? TextInputStyle.Paragraph : TextInputStyle.Short
        )
        .setRequired(question.required);

      return new ActionRowBuilder<TextInputBuilder>().addComponents(textInput);
    });

    modal.addComponents(...components);

    await interaction.showModal(modal);
  } catch (error) {
    console.error(chalk.red('❌ Error handling ticket panel select:'), error);
  }
}

async function handleTicketModalSubmit(interaction: any) {
  try {
    const config = ConfigHandler.getConfig();
    const [, , panelNumber, categoryIndex] = interaction.customId.split('_');

    const panels = ConfigHandler.getPanels();
    const panel = panels.panels[parseInt(panelNumber)];
    const category = panel.categories[parseInt(categoryIndex)];

    await interaction.reply({
      content: '⌛ Creating your ticket...',
      ephemeral: true,
    });

    const answers: string[] = [];
    category.modal.questions.forEach((question, index) => {
      const answer = interaction.fields.getTextInputValue(`question_${index}`);
      answers.push(`**${question.label}:**\n${answer}`);
    });

    const ticketChannel = await TicketManager.createTicket(
      interaction.guild,
      interaction.user,
      category.label,
      answers
    );

    if (ticketChannel) {
      await interaction.editReply({
        content: `✅ ${config.ticket_created_message}\n${ticketChannel}`,
      });
    } else {
      await interaction.editReply({
        content: '❌ Failed to create ticket. Please try again.',
      });
    }
  } catch (error) {
    console.error(chalk.red('❌ Error handling ticket modal submit:'), error);
  }
}

async function handleButtonInteraction(interaction: any) {
  try {
    const config = ConfigHandler.getConfig();

    if (interaction.customId === 'close_ticket') {
      const member = interaction.member;
      const hasPermission = config.staff_roles.some((roleId: string) =>
        member.roles.cache.has(roleId)
      ) || member.permissions.has(PermissionFlagsBits.ManageChannels);

      if (!hasPermission) {
        await interaction.reply({
          content: '❌ Only staff members can close tickets.',
          ephemeral: true,
        });
        return;
      }

      const ticket = TicketManager.getTicketByChannel(interaction.channelId);
      if (!ticket) {
        await interaction.reply({
          content: '❌ This channel is not a ticket.',
          ephemeral: true,
        });
        return;
      }

      await interaction.reply({
        content: '⌛ Closing ticket...',
        ephemeral: true,
      });

      const channel = interaction.channel as TextChannel;
      const transcriptPath = await TranscriptGenerator.generateHTMLTranscript(
        channel,
        ticket.ticketId
      );

      if (transcriptPath) {
        const transcriptChannel = await interaction.guild.channels.fetch(
          config.transcript_channel_id
        ) as TextChannel;

        if (transcriptChannel) {
          const embed = new EmbedBuilder()
            .setTitle(`📜 Ticket Transcript: ${ticket.ticketId}`)
            .setDescription(
              `**User:** <@${ticket.data.userId}>\n**Category:** ${ticket.data.category}\n**Closed by:** ${interaction.user}`
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
        } catch (error) {
          console.error(chalk.red('❌ Error deleting channel:'), error);
        }
      }, 5000);
    } else if (interaction.customId.startsWith('rating_')) {
      const [, ticketId, ratingStr] = interaction.customId.split('_');
      const rating = parseInt(ratingStr);

      const allTickets = TicketManager.getAllTickets();
      const ticketData = allTickets[ticketId];
      
      if (!ticketData) {
        await interaction.update({
          content: '❌ Ticket not found.',
          embeds: [],
          components: [],
        });
        return;
      }

      const guild = interaction.client.guilds.cache.get(ticketData.guildId);
      if (!guild) {
        await interaction.update({
          content: '❌ Unable to process feedback at this time.',
          embeds: [],
          components: [],
        });
        return;
      }

      const feedbackChannel = await guild.channels.fetch(
        config.feedback_channel_id
      ) as TextChannel;

      await FeedbackManager.recordFeedback(
        interaction.user,
        ticketId,
        rating,
        feedbackChannel
      );

      await interaction.update({
        content: '✅ Thank you for your feedback!',
        embeds: [],
        components: [],
      });
    }
  } catch (error) {
    console.error(chalk.red('❌ Error handling button interaction:'), error);
  }
}
