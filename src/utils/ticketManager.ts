import * as fs from 'fs';
import * as path from 'path';
import {
  Guild,
  TextChannel,
  User,
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
} from 'discord.js';
import { ConfigHandler } from './configHandler.js';
import { TicketData, TicketPriority, TicketStatus, TicketMessage } from '../types/index.js';
import { Lang } from './languageManager.js';
import { Logger } from './logger.js';
import { LogType } from '../types/index.js';
import chalk from 'chalk';

interface TicketsDatabase {
  [ticketId: string]: TicketData;
}

export class TicketManager {
  private static ticketsPath = path.join(process.cwd(), 'data', 'tickets.json');

  static {
    const dir = path.dirname(this.ticketsPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private static loadTickets(): TicketsDatabase {
    try {
      if (!fs.existsSync(this.ticketsPath)) {
        fs.writeFileSync(this.ticketsPath, '{}');
        return {};
      }
      const data = fs.readFileSync(this.ticketsPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(chalk.red('❌ Error loading tickets:'), error);
      return {};
    }
  }

  private static saveTickets(tickets: TicketsDatabase): void {
    try {
      fs.writeFileSync(this.ticketsPath, JSON.stringify(tickets, null, 2));
    } catch (error) {
      console.error(chalk.red('❌ Error saving tickets:'), error);
    }
  }

  static checkWorkingHours(panelNumber: number): { isOutsideHours: boolean; embed?: EmbedBuilder } {
    const panels = ConfigHandler.getPanels();
    const panel = panels.panels[panelNumber];
    
    if (!panel || !panel.working_hours?.enabled) {
      return { isOutsideHours: false };
    }

    const now = new Date();
    const timezone = panel.working_hours.timezone;
    
    const dayName = now.toLocaleDateString('en-US', { 
      weekday: 'long',
      timeZone: timezone
    }).toLowerCase() as keyof typeof panel.working_hours.schedule;
    
    const daySchedule = panel.working_hours.schedule[dayName];

    if (!daySchedule?.enabled) {
      const embed = new EmbedBuilder()
        .setTitle(panel.working_hours.message.title)
        .setDescription(panel.working_hours.message.description)
        .setColor(panel.working_hours.message.color as any)
        .setTimestamp();
      return { isOutsideHours: true, embed };
    }

    const currentTime = now.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      timeZone: timezone
    });

    if (currentTime < daySchedule.start || currentTime > daySchedule.end) {
      const embed = new EmbedBuilder()
        .setTitle(panel.working_hours.message.title)
        .setDescription(panel.working_hours.message.description)
        .setColor(panel.working_hours.message.color as any)
        .setTimestamp();
      return { isOutsideHours: true, embed };
    }

    return { isOutsideHours: false };
  }

  static async createTicket(
    guild: Guild,
    user: User,
    category: string,
    answers: string[],
    panelNumber: number,
    categoryIndex: number,
    client?: Client
  ): Promise<TextChannel | null> {
    try {
      const config = ConfigHandler.getConfig();
      const panels = ConfigHandler.getPanels();
      const panel = panels.panels[panelNumber];
      const tickets = this.loadTickets();

      const userTickets = Object.values(tickets).filter(
        t => t.userId === user.id && (t.status === TicketStatus.OPEN || t.status === TicketStatus.CLAIMED)
      );

      if (userTickets.length >= config.automation.max_tickets_per_user) {
        return null;
      }

      const ticketNumber = Object.keys(tickets).length + 1;
      const ticketId = `ticket-${ticketNumber.toString().padStart(4, '0')}`;

      const permissionOverwrites: any[] = [
        {
          id: guild.id,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.AttachFiles,
          ],
        },
      ];

      for (const roleId of config.staff_roles) {
        const roleIdStr = String(roleId).trim();
        if (roleIdStr) {
          const role = guild.roles.cache.get(roleIdStr);
          if (role) {
            permissionOverwrites.push({
              id: roleIdStr,
              allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory,
                PermissionFlagsBits.ManageMessages,
                PermissionFlagsBits.AttachFiles,
              ],
            });
          } else {
            console.warn(chalk.yellow(`⚠️ Staff role ${roleIdStr} not found in guild, skipping...`));
          }
        }
      }

      const channel = await guild.channels.create({
        name: `${ticketId}-${user.username}`,
        type: ChannelType.GuildText,
        parent: panel.ticket_category_id,
        permissionOverwrites,
      });

      const ticketData: TicketData = {
        ticketId,
        channelId: channel.id,
        guildId: guild.id,
        userId: user.id,
        username: user.username,
        category,
        panelNumber,
        categoryIndex,
        createdAt: Date.now(),
        priority: TicketPriority.MEDIUM,
        tags: [],
        status: TicketStatus.OPEN,
        messages: answers.map((answer, index) => ({
          authorId: user.id,
          authorUsername: user.username,
          content: answer,
          timestamp: Date.now() + index,
        })),
        lastActivity: Date.now(),
      };

      tickets[ticketId] = ticketData;
      this.saveTickets(tickets);

      const embed = new EmbedBuilder()
        .setTitle(Lang.t('ticket_create.welcome_title'))
        .setDescription(
          Lang.t('ticket_create.welcome_description', {
            ticketId,
            category,
            priority: this.getPriorityDisplay(TicketPriority.MEDIUM),
            timestamp: `<t:${Math.floor(Date.now() / 1000)}:R>`,
          }) + `\n\n**${category}**\n${answers.map((a, i) => `**Q${i + 1}:** ${a}`).join('\n\n')}`
        )
        .setColor(panel.color as any)
        .setFooter({ text: Lang.t('footer.ticket', { ticketId, status: 'Open' }) })
        .setTimestamp();

      if (panel.thumbnail) {
        embed.setThumbnail(panel.thumbnail);
      }

      if (panel.author?.name) {
        embed.setAuthor({
          name: panel.author.name,
          iconURL: panel.author.icon_url,
        });
      }

      const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('ticket_claim')
          .setLabel('Claim')
          .setEmoji('✋')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('ticket_close')
          .setLabel('Close')
          .setEmoji('🔒')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('ticket_priority')
          .setLabel('Priority')
          .setEmoji('🎯')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('ticket_transcript')
          .setLabel('Transcript')
          .setEmoji('📄')
          .setStyle(ButtonStyle.Secondary)
      );

      const embedMessage = await channel.send({ content: `${user}`, embeds: [embed], components: [buttons] });

      ticketData.embedMessageId = embedMessage.id;
      this.saveTickets(tickets);

      const workingHoursCheck = this.checkWorkingHours(panelNumber);
      if (workingHoursCheck.isOutsideHours && workingHoursCheck.embed) {
        await channel.send({ embeds: [workingHoursCheck.embed] });
      }

      Logger.log(
        LogType.TICKET_CREATED,
        user.id,
        user.username,
        `Created ticket ${ticketId} in category: ${category}`,
        ticketId
      );

      if (client && panel.log_channel_id) {
        await Logger.sendToLogChannel(client, {
          timestamp: Date.now(),
          type: LogType.TICKET_CREATED,
          userId: user.id,
          username: user.username,
          details: `Created ticket ${ticketId} in category: ${category}`,
          ticketId,
        }, panel.log_channel_id);
      }

      console.log(chalk.green(`✅ Ticket ${ticketId} created for ${user.tag}`));
      return channel;
    } catch (error) {
      console.error(chalk.red('❌ Error creating ticket:'), error);
      return null;
    }
  }

  static claimTicket(ticketId: string, userId: string, username: string): boolean {
    const tickets = this.loadTickets();
    const ticket = tickets[ticketId];

    if (!ticket || ticket.status === TicketStatus.CLOSED) {
      return false;
    }

    if (ticket.claimedBy) {
      return false;
    }

    ticket.claimedBy = userId;
    ticket.claimedByUsername = username;
    ticket.status = TicketStatus.CLAIMED;
    this.saveTickets(tickets);

    Logger.log(
      LogType.TICKET_CLAIMED,
      userId,
      username,
      `Claimed ticket ${ticketId}`,
      ticketId
    );

    return true;
  }

  static unclaimTicket(ticketId: string): boolean {
    const tickets = this.loadTickets();
    const ticket = tickets[ticketId];

    if (!ticket || !ticket.claimedBy) {
      return false;
    }

    delete ticket.claimedBy;
    delete ticket.claimedByUsername;
    ticket.status = TicketStatus.OPEN;
    this.saveTickets(tickets);

    Logger.log(
      LogType.TICKET_UNCLAIMED,
      ticket.userId,
      ticket.username,
      `Unclaimed ticket ${ticketId}`,
      ticketId
    );

    return true;
  }

  static setPriority(ticketId: string, priority: TicketPriority, userId: string, username: string): boolean {
    const tickets = this.loadTickets();
    const ticket = tickets[ticketId];

    if (!ticket) {
      return false;
    }

    ticket.priority = priority;
    this.saveTickets(tickets);

    Logger.log(
      LogType.PRIORITY_CHANGED,
      userId,
      username,
      `Changed priority to ${priority}`,
      ticketId
    );

    return true;
  }

  static addTag(ticketId: string, tag: string, userId: string, username: string): boolean {
    const tickets = this.loadTickets();
    const ticket = tickets[ticketId];

    if (!ticket || ticket.tags.includes(tag)) {
      return false;
    }

    ticket.tags.push(tag);
    this.saveTickets(tickets);

    Logger.log(
      LogType.TAG_ADDED,
      userId,
      username,
      `Added tag: ${tag}`,
      ticketId
    );

    return true;
  }

  static removeTag(ticketId: string, tag: string, userId: string, username: string): boolean {
    const tickets = this.loadTickets();
    const ticket = tickets[ticketId];

    if (!ticket || !ticket.tags.includes(tag)) {
      return false;
    }

    ticket.tags = ticket.tags.filter(t => t !== tag);
    this.saveTickets(tickets);

    Logger.log(
      LogType.TAG_REMOVED,
      userId,
      username,
      `Removed tag: ${tag}`,
      ticketId
    );

    return true;
  }

  static addMessage(ticketId: string, message: TicketMessage): void {
    const tickets = this.loadTickets();
    const ticket = tickets[ticketId];

    if (!ticket) {
      return;
    }

    ticket.messages.push(message);
    ticket.lastActivity = Date.now();
    ticket.inactivityWarned = false;
    delete ticket.inactivityWarningTime;
    this.saveTickets(tickets);
  }

  static closeTicket(ticketId: string, userId: string, username: string): boolean {
    const tickets = this.loadTickets();
    const ticket = tickets[ticketId];

    if (!ticket || ticket.status === TicketStatus.CLOSED) {
      return false;
    }

    ticket.status = TicketStatus.CLOSED;
    ticket.lastActivity = Date.now();
    this.saveTickets(tickets);

    Logger.log(
      LogType.TICKET_CLOSED,
      userId,
      username,
      `Closed ticket ${ticketId}`,
      ticketId
    );

    return true;
  }

  static reopenTicket(ticketId: string, userId: string, username: string): boolean {
    const tickets = this.loadTickets();
    const ticket = tickets[ticketId];

    if (!ticket || ticket.status !== TicketStatus.CLOSED) {
      return false;
    }

    ticket.status = TicketStatus.OPEN;
    ticket.lastActivity = Date.now();
    this.saveTickets(tickets);

    Logger.log(
      LogType.TICKET_REOPENED,
      userId,
      username,
      `Reopened ticket ${ticketId}`,
      ticketId
    );

    return true;
  }

  static deleteTicket(ticketId: string, userId: string, username: string): boolean {
    const tickets = this.loadTickets();
    const ticket = tickets[ticketId];

    if (!ticket) {
      return false;
    }

    ticket.status = TicketStatus.DELETED;
    this.saveTickets(tickets);

    Logger.log(
      LogType.TICKET_DELETED,
      userId,
      username,
      `Deleted ticket ${ticketId}`,
      ticketId
    );

    return true;
  }

  static setRating(ticketId: string, rating: number, feedback?: string): boolean {
    const tickets = this.loadTickets();
    const ticket = tickets[ticketId];

    if (!ticket) {
      return false;
    }

    ticket.rating = rating;
    ticket.feedbackText = feedback;
    this.saveTickets(tickets);

    Logger.log(
      LogType.RATING_SUBMITTED,
      ticket.userId,
      ticket.username,
      `Submitted rating: ${rating}/5`,
      ticketId,
      { rating, feedback }
    );

    return true;
  }

  static getTicketByChannel(channelId: string): { ticketId: string; data: TicketData } | null {
    const tickets = this.loadTickets();
    for (const [ticketId, data] of Object.entries(tickets)) {
      if (data.channelId === channelId && data.status !== TicketStatus.DELETED) {
        return { ticketId, data };
      }
    }
    return null;
  }

  static getTicketById(ticketId: string): TicketData | null {
    const tickets = this.loadTickets();
    return tickets[ticketId] || null;
  }

  static getAllTickets(): TicketData[] {
    const tickets = this.loadTickets();
    return Object.values(tickets);
  }

  static getOpenTickets(): TicketData[] {
    return this.getAllTickets().filter(
      t => t.status === TicketStatus.OPEN || t.status === TicketStatus.CLAIMED
    );
  }

  static getInactiveTickets(minutes: number): TicketData[] {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    return this.getOpenTickets().filter(t => t.lastActivity < cutoff);
  }

  static setInactivityWarned(ticketId: string): void {
    const tickets = this.loadTickets();
    const ticket = tickets[ticketId];

    if (ticket) {
      ticket.inactivityWarned = true;
      ticket.inactivityWarningTime = Date.now();
      this.saveTickets(tickets);
    }
  }

  static getPriorityDisplay(priority: TicketPriority): string {
    return Lang.t(`priority.${priority}`);
  }

  static getPriorityColor(priority: TicketPriority): string {
    const config = ConfigHandler.getConfig();
    return config.priority_colors[priority];
  }
}
