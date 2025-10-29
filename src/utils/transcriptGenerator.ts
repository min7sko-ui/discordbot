import * as fs from 'fs';
import { TextChannel, Message, Collection } from 'discord.js';
import { format } from 'date-fns';
import chalk from 'chalk';

export class TranscriptGenerator {
  static async generateHTMLTranscript(
    channel: TextChannel,
    ticketId: string
  ): Promise<string | null> {
    try {
      const messages = await this.fetchAllMessages(channel);
      
      const html = this.createHTML(messages, channel.name, ticketId);
      
      const filename = `${ticketId}_${Date.now()}.html`;
      const filepath = `data/transcripts/${filename}`;
      
      fs.writeFileSync(filepath, html);
      
      console.log(chalk.green(`✅ HTML transcript generated: ${filename}`));
      return filepath;
    } catch (error) {
      console.error(chalk.red('❌ Error generating HTML transcript:'), error);
      return null;
    }
  }

  static async generateTextTranscript(
    channel: TextChannel,
    ticketId: string
  ): Promise<string | null> {
    try {
      const messages = await this.fetchAllMessages(channel);
      
      let text = `=== Ticket Transcript: ${ticketId} ===\n`;
      text += `Channel: ${channel.name}\n`;
      text += `Generated: ${new Date().toISOString()}\n`;
      text += `Total Messages: ${messages.size}\n`;
      text += `\n${'='.repeat(60)}\n\n`;

      messages.reverse().forEach((msg) => {
        const timestamp = format(msg.createdAt, 'yyyy-MM-dd HH:mm:ss');
        text += `[${timestamp}] ${msg.author.tag}:\n${msg.content}\n\n`;
      });

      const filename = `${ticketId}_${Date.now()}.txt`;
      const filepath = `data/transcripts/${filename}`;
      
      fs.writeFileSync(filepath, text);
      
      console.log(chalk.green(`✅ Text transcript generated: ${filename}`));
      return filepath;
    } catch (error) {
      console.error(chalk.red('❌ Error generating text transcript:'), error);
      return null;
    }
  }

  private static async fetchAllMessages(
    channel: TextChannel
  ): Promise<Collection<string, Message>> {
    let allMessages = new Collection<string, Message>();
    let lastMessageId: string | undefined;

    while (true) {
      const options: any = { limit: 100 };
      if (lastMessageId) {
        options.before = lastMessageId;
      }

      const fetchedMessages = await channel.messages.fetch(options);
      
      if (fetchedMessages.size === 0) break;
      
      allMessages = allMessages.concat(fetchedMessages);
      lastMessageId = fetchedMessages.last()?.id;
      
      if (fetchedMessages.size < 100) break;
    }

    return allMessages;
  }

  private static createHTML(
    messages: Collection<string, Message>,
    channelName: string,
    ticketId: string
  ): string {
    const sortedMessages = Array.from(messages.values()).reverse();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ticket Transcript - ${ticketId}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #36393f;
      color: #dcddde;
      padding: 20px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: #2f3136;
      border-radius: 8px;
      padding: 30px;
    }
    .header {
      border-bottom: 2px solid #5865f2;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #5865f2;
      font-size: 28px;
      margin-bottom: 10px;
    }
    .header .info {
      color: #b9bbbe;
      font-size: 14px;
    }
    .message {
      display: flex;
      padding: 15px;
      margin-bottom: 15px;
      border-radius: 5px;
      background: #40444b;
    }
    .message:hover {
      background: #42464d;
    }
    .avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #5865f2;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      margin-right: 15px;
      flex-shrink: 0;
    }
    .message-content {
      flex: 1;
    }
    .message-header {
      display: flex;
      align-items: baseline;
      margin-bottom: 5px;
    }
    .username {
      font-weight: 600;
      color: #ffffff;
      margin-right: 8px;
    }
    .timestamp {
      font-size: 12px;
      color: #72767d;
    }
    .message-text {
      color: #dcddde;
      word-wrap: break-word;
      white-space: pre-wrap;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #4f545c;
      text-align: center;
      color: #72767d;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎫 ${ticketId}</h1>
      <div class="info">
        <strong>Channel:</strong> #${channelName}<br>
        <strong>Generated:</strong> ${format(new Date(), 'PPpp')}<br>
        <strong>Messages:</strong> ${sortedMessages.length}
      </div>
    </div>
    
    <div class="messages">
      ${sortedMessages
        .map(
          (msg) => `
        <div class="message">
          <div class="avatar">${msg.author.username.charAt(0).toUpperCase()}</div>
          <div class="message-content">
            <div class="message-header">
              <span class="username">${msg.author.username}</span>
              <span class="timestamp">${format(msg.createdAt, 'PPpp')}</span>
            </div>
            <div class="message-text">${this.escapeHTML(msg.content)}</div>
          </div>
        </div>
      `
        )
        .join('')}
    </div>
    
    <div class="footer">
      Support System © 2025 • Generated on ${format(new Date(), 'PPpp')}
    </div>
  </div>
</body>
</html>`;
  }

  private static escapeHTML(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
