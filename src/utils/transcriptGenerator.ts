import * as fs from 'fs';
import * as path from 'path';
import { TextChannel, Message, Collection, AttachmentBuilder } from 'discord.js';
import { TicketData } from '../types/index.js';
import { format } from 'date-fns';
import { ConfigHandler } from './configHandler.js';
import chalk from 'chalk';

export class TranscriptGenerator {
  private static transcriptsDir = path.join(process.cwd(), 'transcripts');

  static {
    if (!fs.existsSync(this.transcriptsDir)) {
      fs.mkdirSync(this.transcriptsDir, { recursive: true });
    }
  }

  // Modern HTML transcript from ticket data
  static async generateHTML(ticket: TicketData): Promise<string> {
    const config = ConfigHandler.getConfig();
    const timestamp = format(new Date(ticket.createdAt), 'yyyy-MM-dd_HH-mm-ss');
    const filename = `${ticket.ticketId}_${timestamp}.html`;
    const filepath = path.join(this.transcriptsDir, filename);

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ticket Transcript - ${ticket.ticketId}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            line-height: 1.6;
        }
        
        .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #5865f2, #7289da);
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        .header h1 { font-size: 2em; margin-bottom: 10px; }
        
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            padding: 30px;
            background: #f8f9fa;
        }
        
        .info-item {
            background: white;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #5865f2;
        }
        
        .info-item label {
            display: block;
            font-weight: bold;
            color: #5865f2;
            margin-bottom: 5px;
            font-size: 0.85em;
            text-transform: uppercase;
        }
        
        .messages {
            padding: 30px;
        }
        
        .message {
            margin-bottom: 20px;
            padding: 15px;
            border-radius: 10px;
            background: #f8f9fa;
            border-left: 4px solid #5865f2;
            transition: transform 0.2s;
        }
        
        .message:hover { transform: translateX(5px); }
        
        .message-header {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
        }
        
        .message-author {
            font-weight: bold;
            color: #5865f2;
            margin-right: 10px;
        }
        
        .message-time { color: #999; font-size: 0.85em; }
        
        .message-content {
            color: #333;
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        
        .tags {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 10px;
        }
        
        .tag {
            background: #5865f2;
            color: white;
            padding: 5px 12px;
            border-radius: 15px;
            font-size: 0.85em;
        }
        
        .rating {
            text-align: center;
            padding: 30px;
            background: #fff3cd;
            border-top: 3px solid #ffc107;
        }
        
        .rating h3 { color: #856404; margin-bottom: 10px; }
        .stars { font-size: 2em; color: #ffc107; }
        
        .footer {
            background: #343a40;
            color: white;
            text-align: center;
            padding: 20px;
            font-size: 0.9em;
        }
        
        .priority {
            display: inline-block;
            padding: 5px 15px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 0.9em;
        }
        
        .priority-low { background: #00ff00; color: #000; }
        .priority-medium { background: #ffff00; color: #000; }
        .priority-high { background: #ff8800; color: #fff; }
        .priority-urgent { background: #ff0000; color: #fff; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📄 Ticket Transcript</h1>
            <p>${config.bot_name || 'Support System'}</p>
        </div>
        
        <div class="info-grid">
            <div class="info-item"><label>Ticket ID</label><value>${ticket.ticketId}</value></div>
            <div class="info-item"><label>Category</label><value>${ticket.category}</value></div>
            <div class="info-item"><label>User</label><value>${ticket.username}</value></div>
            <div class="info-item"><label>Priority</label><value><span class="priority priority-${ticket.priority}">${ticket.priority.toUpperCase()}</span></value></div>
            <div class="info-item"><label>Created</label><value>${format(new Date(ticket.createdAt), 'MMM dd, yyyy HH:mm')}</value></div>
            <div class="info-item"><label>Status</label><value>${ticket.status.toUpperCase()}</value></div>
            ${ticket.claimedByUsername ? `<div class="info-item"><label>Claimed By</label><value>${ticket.claimedByUsername}</value></div>` : ''}
            ${ticket.tags.length > 0 ? `<div class="info-item" style="grid-column: 1 / -1;"><label>Tags</label><div class="tags">${ticket.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div></div>` : ''}
        </div>
        
        <div class="messages">
            <h2 style="margin-bottom: 20px; color: #333;">Messages</h2>
            ${ticket.messages.map(msg => `
                <div class="message">
                    <div class="message-header">
                        <span class="message-author">${msg.authorUsername}</span>
                        <span class="message-time">${format(new Date(msg.timestamp), 'MMM dd, yyyy HH:mm:ss')}</span>
                    </div>
                    <div class="message-content">${this.escapeHTML(msg.content)}</div>
                    ${msg.attachments && msg.attachments.length > 0 ? `<div style="margin-top: 10px; font-size: 0.9em; color: #666;">📎 Attachments: ${msg.attachments.map(a => `<a href="${a}" target="_blank">${a}</a>`).join(', ')}</div>` : ''}
                </div>
            `).join('')}
        </div>
        
        ${ticket.rating ? `
        <div class="rating">
            <h3>Customer Feedback</h3>
            <div class="stars">${'⭐'.repeat(ticket.rating)}</div>
            <p style="margin-top: 10px; color: #856404;">${ticket.rating}/5 Stars</p>
            ${ticket.feedbackText ? `<p style="margin-top: 10px; color: #333;"><em>"${this.escapeHTML(ticket.feedbackText)}"</em></p>` : ''}
        </div>
        ` : ''}
        
        <div class="footer">
            <p>${config.footer_text || 'Support System © 2025'}</p>
            <p style="margin-top: 5px; font-size: 0.85em;">Generated on ${format(new Date(), 'MMMM dd, yyyy HH:mm:ss')}</p>
        </div>
    </div>
</body>
</html>
    `;

    fs.writeFileSync(filepath, html);
    console.log(chalk.green(`✅ HTML transcript generated: ${filename}`));
    return filepath;
  }

  static async generateTXT(ticket: TicketData): Promise<string> {
    const config = ConfigHandler.getConfig();
    const timestamp = format(new Date(ticket.createdAt), 'yyyy-MM-dd_HH-mm-ss');
    const filename = `${ticket.ticketId}_${timestamp}.txt`;
    const filepath = path.join(this.transcriptsDir, filename);

    let content = `
╔════════════════════════════════════════════════════════════════╗
║                      TICKET TRANSCRIPT                          ║
║                    ${config.bot_name || 'Support System'}                          ║
╚════════════════════════════════════════════════════════════════╝

TICKET INFORMATION
─────────────────────────────────────────────────────────────────
Ticket ID:      ${ticket.ticketId}
Category:       ${ticket.category}
User:           ${ticket.username} (${ticket.userId})
Priority:       ${ticket.priority.toUpperCase()}
Status:         ${ticket.status.toUpperCase()}
Created:        ${format(new Date(ticket.createdAt), 'MMMM dd, yyyy HH:mm:ss')}
${ticket.claimedByUsername ? `Claimed By:     ${ticket.claimedByUsername}\n` : ''}${ticket.tags.length > 0 ? `Tags:           ${ticket.tags.join(', ')}\n` : ''}
═════════════════════════════════════════════════════════════════

MESSAGES
─────────────────────────────────────────────────────────────────
${ticket.messages.map(msg => `
[${format(new Date(msg.timestamp), 'yyyy-MM-dd HH:mm:ss')}] ${msg.authorUsername}:
${msg.content}
${msg.attachments && msg.attachments.length > 0 ? `Attachments: ${msg.attachments.join(', ')}\n` : ''}
─────────────────────────────────────────────────────────────────`).join('\n')}

${ticket.rating ? `
═════════════════════════════════════════════════════════════════
CUSTOMER FEEDBACK
Rating: ${'★'.repeat(ticket.rating)}${'☆'.repeat(5 - ticket.rating)} (${ticket.rating}/5)
${ticket.feedbackText ? `Feedback: ${ticket.feedbackText}\n` : ''}═════════════════════════════════════════════════════════════════
` : ''}
Generated: ${format(new Date(), 'MMMM dd, yyyy HH:mm:ss')}
${config.footer_text || 'Support System © 2025'}
    `;

    fs.writeFileSync(filepath, content.trim());
    console.log(chalk.green(`✅ TXT transcript generated: ${filename}`));
    return filepath;
  }

  static async generate(ticket: TicketData, formatType: 'html' | 'txt' | 'both' = 'html'): Promise<string[]> {
    const files: string[] = [];

    if (formatType === 'html' || formatType === 'both') {
      files.push(await this.generateHTML(ticket));
    }

    if (formatType === 'txt' || formatType === 'both') {
      files.push(await this.generateTXT(ticket));
    }

    return files;
  }

  static createAttachment(filepath: string): AttachmentBuilder {
    return new AttachmentBuilder(filepath);
  }

  private static escapeHTML(text: string): string {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  // Legacy methods for backward compatibility
  static async generateHTMLTranscript(channel: TextChannel, ticketId: string): Promise<string | null> {
    try {
      const messages = await this.fetchAllMessages(channel);
      const html = this.createLegacyHTML(messages, channel.name, ticketId);
      
      const filename = `${ticketId}_${Date.now()}.html`;
      const filepath = path.join(this.transcriptsDir, filename);
      
      fs.writeFileSync(filepath, html);
      console.log(chalk.green(`✅ HTML transcript generated: ${filename}`));
      return filepath;
    } catch (error) {
      console.error(chalk.red('❌ Error generating HTML transcript:'), error);
      return null;
    }
  }

  static async generateTextTranscript(channel: TextChannel, ticketId: string): Promise<string | null> {
    try {
      const messages = await this.fetchAllMessages(channel);
      
      let text = `=== Ticket Transcript: ${ticketId} ===\n`;
      text += `Channel: ${channel.name}\n`;
      text += `Generated: ${new Date().toISOString()}\n`;
      text += `Total Messages: ${messages.size}\n\n`;
      text += `${'='.repeat(60)}\n\n`;

      messages.reverse().forEach((msg) => {
        const timestamp = format(msg.createdAt, 'yyyy-MM-dd HH:mm:ss');
        text += `[${timestamp}] ${msg.author.tag}:\n${msg.content}\n\n`;
      });

      const filename = `${ticketId}_${Date.now()}.txt`;
      const filepath = path.join(this.transcriptsDir, filename);
      
      fs.writeFileSync(filepath, text);
      console.log(chalk.green(`✅ Text transcript generated: ${filename}`));
      return filepath;
    } catch (error) {
      console.error(chalk.red('❌ Error generating text transcript:'), error);
      return null;
    }
  }

  private static async fetchAllMessages(channel: TextChannel): Promise<Collection<string, Message>> {
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

  private static createLegacyHTML(messages: Collection<string, Message>, channelName: string, ticketId: string): string {
    const sortedMessages = Array.from(messages.values()).reverse();
    const config = ConfigHandler.getConfig();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ticket Transcript - ${ticketId}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #36393f; color: #dcddde; padding: 20px; }
    .container { max-width: 1200px; margin: 0 auto; background: #2f3136; border-radius: 8px; padding: 30px; }
    .header { border-bottom: 2px solid #5865f2; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { color: #5865f2; font-size: 28px; margin-bottom: 10px; }
    .header .info { color: #b9bbbe; font-size: 14px; }
    .message { display: flex; padding: 15px; margin-bottom: 15px; border-radius: 5px; background: #40444b; }
    .message:hover { background: #42464d; }
    .avatar { width: 40px; height: 40px; border-radius: 50%; background: #5865f2; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px; flex-shrink: 0; }
    .message-content { flex: 1; }
    .message-header { display: flex; align-items: baseline; margin-bottom: 5px; }
    .username { font-weight: 600; color: #ffffff; margin-right: 8px; }
    .timestamp { font-size: 12px; color: #72767d; }
    .message-text { color: #dcddde; word-wrap: break-word; white-space: pre-wrap; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #4f545c; text-align: center; color: #72767d; font-size: 12px; }
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
      ${sortedMessages.map(msg => `
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
      `).join('')}
    </div>
    
    <div class="footer">
      ${config.footer_text || 'Support System © 2025'} • Generated on ${format(new Date(), 'PPpp')}
    </div>
  </div>
</body>
</html>`;
  }
}
