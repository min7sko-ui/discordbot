import * as fs from 'fs';
import * as path from 'path';
import { LogEntry, LogType } from '../types/index.js';
import { format } from 'date-fns';
import chalk from 'chalk';
import { EmbedBuilder, TextChannel, Client } from 'discord.js';
import { ConfigHandler } from './configHandler.js';

export class Logger {
  private static logsDir = path.join(process.cwd(), 'logs');
  private static dataFile = path.join(process.cwd(), 'data', 'logs.json');
  private static logs: LogEntry[] = [];

  static {
    // Ensure directories exist
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
    if (!fs.existsSync(path.dirname(this.dataFile))) {
      fs.mkdirSync(path.dirname(this.dataFile), { recursive: true });
    }
    this.loadLogs();
  }

  private static loadLogs(): void {
    try {
      if (fs.existsSync(this.dataFile)) {
        const data = fs.readFileSync(this.dataFile, 'utf8');
        this.logs = JSON.parse(data);
      }
    } catch (error) {
      console.error(chalk.red('❌ Error loading logs:'), error);
      this.logs = [];
    }
  }

  private static saveLogs(): void {
    try {
      fs.writeFileSync(this.dataFile, JSON.stringify(this.logs, null, 2));
    } catch (error) {
      console.error(chalk.red('❌ Error saving logs:'), error);
    }
  }

  public static log(
    type: LogType,
    userId: string,
    username: string,
    details: string,
    ticketId?: string,
    metadata?: any
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: Date.now(),
      type,
      userId,
      username,
      details,
      ticketId,
      metadata,
    };

    this.logs.push(entry);
    this.saveLogs();
    this.writeToFile(entry);

    console.log(chalk.gray(`[LOG] ${type}: ${details}`));
    return entry;
  }

  private static writeToFile(entry: LogEntry): void {
    const date = format(new Date(entry.timestamp), 'yyyy-MM-dd');
    const logFile = path.join(this.logsDir, `${date}.log`);
    
    const logLine = `[${format(new Date(entry.timestamp), 'yyyy-MM-dd HH:mm:ss')}] [${entry.type}] ${entry.username} (${entry.userId}) - ${entry.details}${entry.ticketId ? ` | Ticket: ${entry.ticketId}` : ''}\n`;
    
    fs.appendFileSync(logFile, logLine);
  }

  public static async sendToLogChannel(client: Client, entry: LogEntry): Promise<void> {
    try {
      const config = ConfigHandler.getConfig();
      if (!config.log_channel_id) return;

      const channel = await client.channels.fetch(config.log_channel_id) as TextChannel;
      if (!channel) return;

      const embed = new EmbedBuilder()
        .setTitle(this.getLogTitle(entry.type))
        .setDescription(entry.details)
        .setColor(this.getLogColor(entry.type))
        .addFields(
          { name: 'User', value: `${entry.username} (${entry.userId})`, inline: true },
          { name: 'Type', value: entry.type, inline: true },
          { name: 'Timestamp', value: `<t:${Math.floor(entry.timestamp / 1000)}:F>`, inline: false }
        )
        .setTimestamp(entry.timestamp);

      if (entry.ticketId) {
        embed.addFields({ name: 'Ticket ID', value: entry.ticketId, inline: true });
      }

      await channel.send({ embeds: [embed] });
    } catch (error) {
      console.error(chalk.red('❌ Error sending log to channel:'), error);
    }
  }

  private static getLogTitle(type: LogType): string {
    const titles: { [key in LogType]: string } = {
      [LogType.TICKET_CREATED]: '🎫 Ticket Created',
      [LogType.TICKET_CLOSED]: '🔒 Ticket Closed',
      [LogType.TICKET_REOPENED]: '🔓 Ticket Reopened',
      [LogType.TICKET_DELETED]: '🗑️ Ticket Deleted',
      [LogType.TICKET_CLAIMED]: '✋ Ticket Claimed',
      [LogType.TICKET_UNCLAIMED]: '👋 Ticket Unclaimed',
      [LogType.PRIORITY_CHANGED]: '🎯 Priority Changed',
      [LogType.TAG_ADDED]: '🏷️ Tag Added',
      [LogType.TAG_REMOVED]: '🏷️ Tag Removed',
      [LogType.MEMBER_ADDED]: '➕ Member Added',
      [LogType.MEMBER_REMOVED]: '➖ Member Removed',
      [LogType.RATING_SUBMITTED]: '⭐ Rating Submitted',
    };
    return titles[type] || type;
  }

  private static getLogColor(type: LogType): number {
    const colors: { [key in LogType]: number } = {
      [LogType.TICKET_CREATED]: 0x00ff00,
      [LogType.TICKET_CLOSED]: 0xff0000,
      [LogType.TICKET_REOPENED]: 0x00ff00,
      [LogType.TICKET_DELETED]: 0x808080,
      [LogType.TICKET_CLAIMED]: 0x5865f2,
      [LogType.TICKET_UNCLAIMED]: 0x5865f2,
      [LogType.PRIORITY_CHANGED]: 0xffaa00,
      [LogType.TAG_ADDED]: 0x00ffff,
      [LogType.TAG_REMOVED]: 0x00ffff,
      [LogType.MEMBER_ADDED]: 0x00ff00,
      [LogType.MEMBER_REMOVED]: 0xff0000,
      [LogType.RATING_SUBMITTED]: 0xffd700,
    };
    return colors[type] || 0x5865f2;
  }

  public static getRecentLogs(limit: number = 20): LogEntry[] {
    return this.logs.slice(-limit).reverse();
  }

  public static getLogsByTicket(ticketId: string): LogEntry[] {
    return this.logs.filter(log => log.ticketId === ticketId);
  }

  public static getLogsByType(type: LogType): LogEntry[] {
    return this.logs.filter(log => log.type === type);
  }

  public static clearOldLogs(daysToKeep: number = 30): void {
    const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
    this.logs = this.logs.filter(log => log.timestamp > cutoffTime);
    this.saveLogs();
    console.log(chalk.green(`✅ Cleared logs older than ${daysToKeep} days`));
  }
}
