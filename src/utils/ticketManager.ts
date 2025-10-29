import * as fs from 'fs';
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
} from 'discord.js';
import { ConfigHandler } from './configHandler.js';
import chalk from 'chalk';

interface TicketData {
  channelId: string;
  userId: string;
  category: string;
  createdAt: string;
  closedAt?: string;
  status: 'open' | 'closed';
}

interface TicketsDatabase {
  [ticketId: string]: TicketData;
}

export class TicketManager {
  private static ticketsPath = 'data/tickets.json';

  private static loadTickets(): TicketsDatabase {
    try {
      if (!fs.existsSync(this.ticketsPath)) {
        fs.writeFileSync(this.ticketsPath, '{}');
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

  static async createTicket(
    guild: Guild,
    user: User,
    category: string,
    answers: string[]
  ): Promise<TextChannel | null> {
    try {
      const config = ConfigHandler.getConfig();
      const tickets = this.loadTickets();

      const ticketNumber = Object.keys(tickets).length + 1;
      const ticketId = `ticket-${ticketNumber}`;

      const channel = await guild.channels.create({
        name: `${ticketId}-${user.username}`,
        type: ChannelType.GuildText,
        parent: config.ticket_category_id,
        permissionOverwrites: [
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
            ],
          },
          ...config.staff_roles.map((roleId) => ({
            id: roleId,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.ManageMessages,
            ],
          })),
        ],
      });

      tickets[ticketId] = {
        channelId: channel.id,
        userId: user.id,
        category,
        createdAt: new Date().toISOString(),
        status: 'open',
      };
      this.saveTickets(tickets);

      const embed = new EmbedBuilder()
        .setTitle(`🎫 ${category}`)
        .setDescription(
          `${user} has created a ticket.\n\n**Responses:**\n${answers.join('\n\n')}`
        )
        .setColor(config.embed_color)
        .setFooter({ text: config.footer_text })
        .setTimestamp();

      const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('close_ticket')
          .setLabel('Close Ticket')
          .setEmoji('🔒')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('add_member')
          .setLabel('Add Member')
          .setEmoji('👤')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('remove_member')
          .setLabel('Remove Member')
          .setEmoji('🚫')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('transcript')
          .setLabel('Transcript')
          .setEmoji('📜')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('rate_support')
          .setLabel('Rate Support')
          .setEmoji('⭐')
          .setStyle(ButtonStyle.Success)
      );

      await channel.send({ embeds: [embed], components: [buttons] });

      console.log(chalk.green(`✅ Ticket ${ticketId} created for ${user.tag}`));
      return channel;
    } catch (error) {
      console.error(chalk.red('❌ Error creating ticket:'), error);
      return null;
    }
  }

  static getTicketByChannel(channelId: string): { ticketId: string; data: TicketData } | null {
    const tickets = this.loadTickets();
    for (const [ticketId, data] of Object.entries(tickets)) {
      if (data.channelId === channelId && data.status === 'open') {
        return { ticketId, data };
      }
    }
    return null;
  }

  static closeTicket(ticketId: string): void {
    const tickets = this.loadTickets();
    if (tickets[ticketId]) {
      tickets[ticketId].status = 'closed';
      tickets[ticketId].closedAt = new Date().toISOString();
      this.saveTickets(tickets);
      console.log(chalk.green(`✅ Ticket ${ticketId} closed`));
    }
  }

  static getAllTickets(): TicketsDatabase {
    return this.loadTickets();
  }
}
