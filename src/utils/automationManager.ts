import { Client, TextChannel, EmbedBuilder } from 'discord.js';
import { TicketManager } from './ticketManager.js';
import { ConfigHandler } from './configHandler.js';
import { Lang } from './languageManager.js';
import { Logger } from './logger.js';
import { LogType } from '../types/index.js';
import chalk from 'chalk';

export class AutomationManager {
  private static checkInterval: NodeJS.Timeout | null = null;

  static startMonitoring(client: Client): void {
    if (this.checkInterval) {
      return; // Already running
    }

    // Check every 5 minutes
    this.checkInterval = setInterval(() => {
      this.checkInactivity(client);
      this.checkStaffResponse(client);
    }, 5 * 60 * 1000);

    console.log(chalk.green('✅ Automation monitoring started'));
  }

  static stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log(chalk.yellow('⚠️ Automation monitoring stopped'));
    }
  }

  private static async checkInactivity(client: Client): Promise<void> {
    try {
      const config = ConfigHandler.getConfig();
      
      if (!config.features.auto_close) {
        return;
      }

      const warningMinutes = config.automation.inactivity_warning;
      const closeMinutes = config.automation.inactivity_timeout;

      // Get tickets that need warnings
      const ticketsToWarn = TicketManager.getInactiveTickets(warningMinutes).filter(
        t => !t.inactivityWarned
      );

      for (const ticket of ticketsToWarn) {
        try {
          const channel = await client.channels.fetch(ticket.channelId) as TextChannel;
          if (!channel) continue;

          const timeRemaining = closeMinutes - warningMinutes;
          
          const embed = new EmbedBuilder()
            .setTitle('⚠️ Inactivity Warning')
            .setDescription(
              Lang.t('automation.inactivity_warning', {
                time: `${timeRemaining} minutes`,
              })
            )
            .setColor('#FFA500')
            .setTimestamp();

          await channel.send({ embeds: [embed] });
          TicketManager.setInactivityWarned(ticket.ticketId);
          
          console.log(chalk.yellow(`⚠️ Inactivity warning sent for ${ticket.ticketId}`));
        } catch (error) {
          console.error(chalk.red(`❌ Error sending warning for ${ticket.ticketId}:`), error);
        }
      }

      // Get tickets to auto-close
      const ticketsToClose = TicketManager.getInactiveTickets(closeMinutes).filter(
        t => t.inactivityWarned
      );

      for (const ticket of ticketsToClose) {
        try {
          const channel = await client.channels.fetch(ticket.channelId) as TextChannel;
          if (!channel) continue;

          const embed = new EmbedBuilder()
            .setTitle('🔒 Ticket Auto-Closed')
            .setDescription(Lang.t('automation.auto_closed'))
            .setColor('#FF0000')
            .setTimestamp();

          await channel.send({ embeds: [embed] });
          
          TicketManager.closeTicket(ticket.ticketId, client.user!.id, client.user!.username);
          
          console.log(chalk.red(`🔒 Auto-closed ticket ${ticket.ticketId} due to inactivity`));
        } catch (error) {
          console.error(chalk.red(`❌ Error auto-closing ${ticket.ticketId}:`), error);
        }
      }
    } catch (error) {
      console.error(chalk.red('❌ Error in inactivity check:'), error);
    }
  }

  private static async checkStaffResponse(client: Client): Promise<void> {
    try {
      const config = ConfigHandler.getConfig();
      const reminderMinutes = config.automation.staff_reminder_timeout;

      const unrespondedTickets = TicketManager.getInactiveTickets(reminderMinutes).filter(
        t => t.messages.length === 1 && t.messages[0].authorId === t.userId
      );

      for (const ticket of unrespondedTickets) {
        try {
          const channel = await client.channels.fetch(ticket.channelId) as TextChannel;
          if (!channel) continue;

          const timeWaiting = Math.floor((Date.now() - ticket.lastActivity) / 1000 / 60);
          
          const embed = new EmbedBuilder()
            .setTitle('📢 Staff Reminder')
            .setDescription(
              Lang.t('automation.staff_reminder', {
                ticketId: ticket.ticketId,
                time: `${timeWaiting} minutes`,
              })
            )
            .setColor('#FFA500')
            .setTimestamp();

          // Ping staff roles
          const staffPings = config.staff_roles.map(id => `<@&${id}>`).join(' ');
          await channel.send({ content: staffPings, embeds: [embed] });
          
          console.log(chalk.yellow(`📢 Staff reminder sent for ${ticket.ticketId}`));
        } catch (error) {
          console.error(chalk.red(`❌ Error sending staff reminder for ${ticket.ticketId}:`), error);
        }
      }
    } catch (error) {
      console.error(chalk.red('❌ Error in staff response check:'), error);
    }
  }

  static checkWorkingHours(): { isOpen: boolean; message?: string } {
    const config = ConfigHandler.getConfig();
    
    if (!config.working_hours?.enabled) {
      return { isOpen: true };
    }

    const now = new Date();
    const dayName = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as keyof typeof config.working_hours.schedule;
    const daySchedule = config.working_hours.schedule[dayName];

    if (!daySchedule?.enabled) {
      const hours = this.getWorkingHoursString(config);
      return {
        isOpen: false,
        message: Lang.t('working_hours.outside', { hours }),
      };
    }

    const currentTime = now.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    });

    if (currentTime < daySchedule.start || currentTime > daySchedule.end) {
      const hours = this.getWorkingHoursString(config);
      return {
        isOpen: false,
        message: Lang.t('working_hours.outside', { hours }),
      };
    }

    return { isOpen: true };
  }

  private static getWorkingHoursString(config: any): string {
    const schedule = config.working_hours.schedule;
    const days = Object.entries(schedule)
      .filter(([_, data]: [string, any]) => data.enabled)
      .map(([day, data]: [string, any]) => `${day}: ${data.start}-${data.end}`);
    
    return days.join(', ');
  }

  static checkTicketOverload(): boolean {
    const config = ConfigHandler.getConfig();
    const openTickets = TicketManager.getOpenTickets();
    
    return openTickets.length >= config.automation.ticket_overload_limit;
  }
}
