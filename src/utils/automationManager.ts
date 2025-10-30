import { Client, TextChannel, EmbedBuilder } from 'discord.js';
import { TicketManager } from './ticketManager.js';
import { ConfigHandler } from './configHandler.js';
import { TranscriptGenerator } from './transcriptGenerator.js';
import { Lang } from './languageManager.js';
import { Logger } from './logger.js';
import { LogType } from '../types/index.js';
import chalk from 'chalk';

export class AutomationManager {
  private static checkInterval: NodeJS.Timeout | null = null;

  static startMonitoring(client: Client): void {
    if (this.checkInterval) {
      return;
    }

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
      const panels = ConfigHandler.getPanels();
      
      if (!config.features.auto_close) {
        return;
      }

      const warningMinutes = config.automation.inactivity_timeout;
      const graceMinutes = config.automation.inactivity_warning_grace;
      const totalMinutes = warningMinutes + graceMinutes;

      const ticketsToWarn = TicketManager.getInactiveTickets(warningMinutes).filter(
        t => !t.inactivityWarned
      );

      for (const ticket of ticketsToWarn) {
        try {
          const channel = await client.channels.fetch(ticket.channelId) as TextChannel;
          if (!channel) continue;

          const embed = new EmbedBuilder()
            .setTitle('⚠️ Inactivity Warning')
            .setDescription(
              `<@${ticket.userId}> This ticket has been inactive for ${warningMinutes / 60} hours.\n\n` +
              `⏰ This ticket will be automatically closed in **${graceMinutes / 60} hours** if there is no response.\n\n` +
              `Please respond if you still need assistance.`
            )
            .setColor('#FFA500')
            .setTimestamp();

          await channel.send({ content: `<@${ticket.userId}>`, embeds: [embed] });
          TicketManager.setInactivityWarned(ticket.ticketId);
          
          console.log(chalk.yellow(`⚠️ Inactivity warning sent for ${ticket.ticketId}`));
        } catch (error) {
          console.error(chalk.red(`❌ Error sending warning for ${ticket.ticketId}:`), error);
        }
      }

      const ticketsToClose = TicketManager.getAllTickets().filter(ticket => {
        if (!ticket.inactivityWarned || ticket.status === 'closed') {
          return false;
        }
        
        if (!ticket.inactivityWarningTime) {
          return false;
        }

        const timeSinceWarning = Date.now() - ticket.inactivityWarningTime;
        const gracePeriodMs = graceMinutes * 60 * 1000;
        
        return timeSinceWarning >= gracePeriodMs;
      });

      for (const ticket of ticketsToClose) {
        try {
          const channel = await client.channels.fetch(ticket.channelId) as TextChannel;
          if (!channel) continue;

          const panel = panels.panels[ticket.panelNumber];
          
          if (config.features?.transcripts && panel?.transcript_channel_id) {
            const transcriptPath = await TranscriptGenerator.generateHTMLTranscript(
              channel,
              ticket.ticketId
            );

            if (transcriptPath) {
              const transcriptChannel = await client.channels.fetch(
                panel.transcript_channel_id
              ) as TextChannel;

              if (transcriptChannel) {
                const embed = new EmbedBuilder()
                  .setTitle(`📜 Auto-Closed Ticket Transcript: ${ticket.ticketId}`)
                  .setDescription(
                    `**User:** <@${ticket.userId}>\n**Category:** ${ticket.category}\n**Reason:** Inactivity (${totalMinutes / 60}h no response)`
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

          const embed = new EmbedBuilder()
            .setTitle('🔒 Ticket Auto-Closed')
            .setDescription(
              `This ticket has been automatically closed due to inactivity.\n\n` +
              `**Total time inactive:** ${totalMinutes / 60} hours\n\n` +
              `If you still need help, please open a new ticket.`
            )
            .setColor('#FF0000')
            .setTimestamp();

          await channel.send({ embeds: [embed] });
          
          TicketManager.closeTicket(ticket.ticketId, client.user!.id, client.user!.username);
          
          console.log(chalk.red(`🔒 Auto-closed ticket ${ticket.ticketId} due to inactivity`));

          setTimeout(async () => {
            try {
              await channel.delete();
            } catch (error) {
              console.error(chalk.red('❌ Error deleting channel:'), error);
            }
          }, 10000);
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

  static checkTicketOverload(): boolean {
    const config = ConfigHandler.getConfig();
    const openTickets = TicketManager.getOpenTickets();
    
    return openTickets.length >= config.automation.ticket_overload_limit;
  }
}
