import {
  Interaction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  TextChannel,
  PermissionFlagsBits,
} from 'discord.js';
import { ConfigHandler } from '../utils/configHandler.js';
import { TicketManager } from '../utils/ticketManager.js';
import { BlacklistManager } from '../utils/blacklistManager.js';
import { FeedbackManager } from '../utils/feedbackManager.js';
import { TranscriptGenerator } from '../utils/transcriptGenerator.js';
import { Lang } from '../utils/languageManager.js';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';

async function updateTicketEmbed(interaction: any) {
  const ticket = TicketManager.getTicketByChannel(interaction.channelId);
  if (!ticket) return;

  const config = ConfigHandler.getConfig();
  const channel = interaction.channel as TextChannel;
  
  const ticketData = TicketManager.getTicketById(ticket.ticketId);
  if (!ticketData) return;

  // Fetch the embed message using stored message ID
  let ticketMessage;
  if (ticketData.embedMessageId) {
    try {
      ticketMessage = await channel.messages.fetch(ticketData.embedMessageId);
    } catch (error) {
      console.error(chalk.red('❌ Error fetching ticket embed message:'), error);
      return;
    }
  } else {
    // Fallback: search for the message if ID wasn't stored (old tickets)
    const messages = await channel.messages.fetch({ limit: 50 });
    ticketMessage = messages.find(msg => msg.embeds.length > 0 && msg.author.id === interaction.client.user.id);
  }
  
  if (!ticketMessage || !ticketMessage.embeds[0]) return;

  // Rebuild the description from scratch to avoid duplication
  const originalAnswers = ticketData.messages.filter(m => m.authorId === ticketData.userId)
    .slice(0, 3)
    .map(m => m.content)
    .join('\n\n');

  let description = Lang.t('ticket_create.welcome_description', {
    ticketId: ticket.ticketId,
    category: ticketData.category,
    priority: TicketManager.getPriorityDisplay(ticketData.priority),
    timestamp: `<t:${Math.floor(ticketData.createdAt / 1000)}:R>`,
  }) + `\n\n**${ticketData.category}**\n${originalAnswers}`;

  // Add status information
  description += '\n\n**━━━ Status ━━━**';
  if (ticketData.claimedBy) {
    description += `\n**🔒 Claimed by:** <@${ticketData.claimedBy}>`;
  }
  description += `\n**🎯 Priority:** ${TicketManager.getPriorityDisplay(ticketData.priority)}`;
  if (ticketData.tags && ticketData.tags.length > 0) {
    description += `\n**🏷️ Tags:** ${ticketData.tags.join(', ')}`;
  }

  const updatedEmbed = new EmbedBuilder()
    .setTitle(Lang.t('ticket_create.welcome_title'))
    .setDescription(description)
    .setColor(TicketManager.getPriorityColor(ticketData.priority) as any)
    .setFooter({ text: Lang.t('footer.ticket', { ticketId: ticket.ticketId, status: ticketData.status }) })
    .setTimestamp();

  if (config.thumbnail_url) {
    updatedEmbed.setThumbnail(config.thumbnail_url);
  }

  // Keep the same buttons
  await ticketMessage.edit({ embeds: [updatedEmbed] });
}

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
    } else if (interaction.isModalSubmit()) {
      if (interaction.customId.startsWith('ticket_modal_')) {
        await handleTicketModalSubmit(interaction);
      }
    } else if (interaction.isButton()) {
      await handleButtonInteraction(interaction);
    } else if (interaction.isStringSelectMenu()) {
      if (interaction.customId.startsWith('ticket_panel_')) {
        await handleTicketPanelSelect(interaction);
      } else if (interaction.customId === 'priority_select') {
        await handlePrioritySelect(interaction);
      }
    }
  } catch (error) {
    console.error(chalk.red('❌ Error in interactionCreate:'), error);
  }
}

async function handlePrioritySelect(interaction: any) {
  try {
    const priority = interaction.values[0];
    const ticket = TicketManager.getTicketByChannel(interaction.channelId);
    
    if (!ticket) {
      await interaction.update({
        content: '❌ This channel is not a ticket.',
        components: [],
      });
      return;
    }

    TicketManager.setPriority(ticket.ticketId, priority, interaction.user.id, interaction.user.username);

    await updateTicketEmbed(interaction);

    await interaction.update({
      content: `✅ Priority set to **${priority.toUpperCase()}**`,
      components: [],
    });
  } catch (error) {
    console.error(chalk.red('❌ Error handling priority select:'), error);
  }
}

async function handleTicketPanelSelect(interaction: any) {
  try {
    const config = ConfigHandler.getConfig();

    if (BlacklistManager.isBlacklisted(interaction.user.id)) {
      await interaction.reply({
        content: config.blacklist_message || '❌ You are blacklisted from creating tickets.',
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
      answers,
      parseInt(panelNumber),
      parseInt(categoryIndex),
      interaction.client
    );

    if (ticketChannel) {
      await interaction.editReply({
        content: `✅ ${config.ticket_created_message || 'Your ticket has been created!'}\n${ticketChannel}`,
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

    // Handle ticket claim button
    if (interaction.customId === 'ticket_claim') {
      const member = interaction.member;
      const hasPermission = config.staff_roles.some((roleId: string) =>
        member.roles.cache.has(roleId)
      ) || member.permissions.has(PermissionFlagsBits.ManageChannels);

      if (!hasPermission) {
        await interaction.reply({
          content: '❌ Only staff members can claim tickets.',
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

      const success = TicketManager.claimTicket(ticket.ticketId, interaction.user.id, interaction.user.username);
      
      if (!success) {
        await interaction.reply({
          content: '❌ This ticket is already claimed.',
          ephemeral: true,
        });
        return;
      }

      // Update channel permissions to restrict to claimer only
      const channel = interaction.channel as TextChannel;
      
      // Remove send message permission from ticket creator
      await channel.permissionOverwrites.edit(ticket.data.userId, {
        SendMessages: false,
        ViewChannel: true,
        ReadMessageHistory: true,
      });

      // Ensure claimer can send messages
      await channel.permissionOverwrites.edit(interaction.user.id, {
        SendMessages: true,
        ViewChannel: true,
        ReadMessageHistory: true,
      });

      await updateTicketEmbed(interaction);

      await interaction.reply({
        content: `✅ Ticket claimed by ${interaction.user}! Only staff can now send messages.`,
      });

    // Handle ticket close button
    } else if (interaction.customId === 'ticket_close') {
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
      const panels = ConfigHandler.getPanels();
      const panel = panels.panels[ticket.data.panelNumber];
      
      if (config.features?.transcripts && panel?.transcript_channel_id) {
        const transcriptPath = await TranscriptGenerator.generateHTMLTranscript(
          channel,
          ticket.ticketId
        );

        if (transcriptPath) {
          const transcriptChannel = await interaction.guild.channels.fetch(
            panel.transcript_channel_id
          ) as TextChannel;

          if (transcriptChannel) {
            const embed = new EmbedBuilder()
              .setTitle(`📜 Ticket Transcript: ${ticket.ticketId}`)
              .setDescription(
                `**User:** <@${ticket.data.userId}>\n**Category:** ${ticket.data.category}\n**Closed by:** ${interaction.user}`
              )
              .setColor(config.embed_color as any)
              .setFooter({ text: config.footer_text })
              .setTimestamp();

            await transcriptChannel.send({
              embeds: [embed],
              files: [transcriptPath],
            });
          }
        }
      }

      // Send feedback prompt if enabled
      if (config.features?.ticket_reviews) {
        const user = await interaction.client.users.fetch(ticket.data.userId);
        await FeedbackManager.sendFeedbackPrompt(user, ticket.ticketId);
      }

      TicketManager.closeTicket(ticket.ticketId, interaction.user.id, interaction.user.username);

      const closeEmbed = new EmbedBuilder()
        .setTitle('🔒 Ticket Closed')
        .setDescription(
          (config.close_ticket_message || 'Ticket closed by {user}').replace('{user}', interaction.user.toString())
        )
        .setColor(config.embed_color as any)
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

    // Handle ticket priority button
    } else if (interaction.customId === 'ticket_priority') {
      const member = interaction.member;
      const hasPermission = config.staff_roles.some((roleId: string) =>
        member.roles.cache.has(roleId)
      ) || member.permissions.has(PermissionFlagsBits.ManageChannels);

      if (!hasPermission) {
        await interaction.reply({
          content: '❌ Only staff members can change priority.',
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

      // Create priority selection menu
      const priorityMenu = new StringSelectMenuBuilder()
        .setCustomId('priority_select')
        .setPlaceholder('Select ticket priority')
        .addOptions(
          new StringSelectMenuOptionBuilder()
            .setLabel('Low')
            .setDescription('Low priority issue')
            .setValue('low')
            .setEmoji('🟢'),
          new StringSelectMenuOptionBuilder()
            .setLabel('Medium')
            .setDescription('Medium priority issue')
            .setValue('medium')
            .setEmoji('🟡'),
          new StringSelectMenuOptionBuilder()
            .setLabel('High')
            .setDescription('High priority issue')
            .setValue('high')
            .setEmoji('🟠'),
          new StringSelectMenuOptionBuilder()
            .setLabel('Urgent')
            .setDescription('Urgent priority issue')
            .setValue('urgent')
            .setEmoji('🔴')
        );

      const priorityRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(priorityMenu);

      await interaction.reply({
        content: '🎯 Select the ticket priority:',
        components: [priorityRow],
        ephemeral: true,
      });

    // Handle ticket transcript button
    } else if (interaction.customId === 'ticket_transcript') {
      const member = interaction.member;
      const hasPermission = config.staff_roles.some((roleId: string) =>
        member.roles.cache.has(roleId)
      ) || member.permissions.has(PermissionFlagsBits.ManageChannels);

      if (!hasPermission) {
        await interaction.reply({
          content: '❌ Only staff members can generate transcripts.',
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
        content: '⌛ Generating transcript...',
        ephemeral: true,
      });

      const channel = interaction.channel as TextChannel;
      const panels = ConfigHandler.getPanels();
      const panel = panels.panels[ticket.data.panelNumber];
      
      const transcriptPath = await TranscriptGenerator.generateHTMLTranscript(
        channel,
        ticket.ticketId
      );

      if (transcriptPath && panel?.transcript_channel_id) {
        const transcriptChannel = await interaction.guild.channels.fetch(
          panel.transcript_channel_id
        ) as TextChannel;

        if (transcriptChannel) {
          const embed = new EmbedBuilder()
            .setTitle(`📜 Ticket Transcript: ${ticket.ticketId}`)
            .setDescription(
              `**User:** <@${ticket.data.userId}>\n**Category:** ${ticket.data.category}\n**Generated by:** ${interaction.user}`
            )
            .setColor(config.embed_color as any)
            .setFooter({ text: config.footer_text })
            .setTimestamp();

          await transcriptChannel.send({
            embeds: [embed],
            files: [transcriptPath],
          });

          await interaction.editReply({
            content: `✅ Transcript generated and sent to <#${panel.transcript_channel_id}>`,
          });
        } else {
          await interaction.editReply({
            content: '❌ Transcript channel not found. Please check panel config.',
          });
        }
      } else {
        await interaction.editReply({
          content: '❌ Failed to generate transcript.',
        });
      }

    // Handle rating buttons
    } else if (interaction.customId.startsWith('rating_')) {
      const [, ticketId, ratingStr] = interaction.customId.split('_');
      const rating = parseInt(ratingStr);

      const ticketData = TicketManager.getTicketById(ticketId);
      
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
