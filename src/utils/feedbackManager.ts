import * as fs from 'fs';
import { User, EmbedBuilder, TextChannel } from 'discord.js';
import { ConfigHandler } from './configHandler.js';
import chalk from 'chalk';

interface FeedbackEntry {
  ticketId: string;
  userId: string;
  userName: string;
  rating: number;
  timestamp: string;
}

export class FeedbackManager {
  private static feedbackPath = 'data/feedback.json';

  private static loadFeedback(): FeedbackEntry[] {
    try {
      if (!fs.existsSync(this.feedbackPath)) {
        fs.writeFileSync(this.feedbackPath, '[]');
      }
      const data = fs.readFileSync(this.feedbackPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(chalk.red('❌ Error loading feedback:'), error);
      return [];
    }
  }

  private static saveFeedback(feedback: FeedbackEntry[]): void {
    try {
      fs.writeFileSync(this.feedbackPath, JSON.stringify(feedback, null, 2));
    } catch (error) {
      console.error(chalk.red('❌ Error saving feedback:'), error);
    }
  }

  static async sendFeedbackPrompt(user: User, ticketId: string): Promise<void> {
    try {
      const config = ConfigHandler.getConfig();
      const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = await import('discord.js');
      
      const embed = new EmbedBuilder()
        .setTitle('⭐ Review Your Ticket')
        .setDescription('Please rate your support experience!')
        .setColor(config.embed_color)
        .setFooter({ text: config.footer_text })
        .setTimestamp();

      const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`rating_${ticketId}_1`)
          .setLabel('⭐')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(`rating_${ticketId}_2`)
          .setLabel('⭐⭐')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(`rating_${ticketId}_3`)
          .setLabel('⭐⭐⭐')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(`rating_${ticketId}_4`)
          .setLabel('⭐⭐⭐⭐')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`rating_${ticketId}_5`)
          .setLabel('⭐⭐⭐⭐⭐')
          .setStyle(ButtonStyle.Success)
      );

      await user.send({ embeds: [embed], components: [buttons] });
      console.log(chalk.green(`✅ Feedback prompt sent to ${user.tag}`));
    } catch (error) {
      console.error(chalk.red('❌ Error sending feedback prompt:'), error);
    }
  }

  static async recordFeedback(
    user: User,
    ticketId: string,
    rating: number,
    feedbackChannel: TextChannel
  ): Promise<void> {
    try {
      const config = ConfigHandler.getConfig();
      const feedback = this.loadFeedback();

      const entry: FeedbackEntry = {
        ticketId,
        userId: user.id,
        userName: user.tag,
        rating,
        timestamp: new Date().toISOString(),
      };

      feedback.push(entry);
      this.saveFeedback(feedback);

      const stars = '⭐'.repeat(rating);
      const embed = new EmbedBuilder()
        .setTitle('📊 New Feedback Received')
        .setDescription(`**User:** ${user}\n**Ticket:** ${ticketId}\n**Rating:** ${stars} (${rating}/5)`)
        .setColor(config.embed_color)
        .setFooter({ text: config.footer_text })
        .setTimestamp();

      await feedbackChannel.send({ embeds: [embed] });

      await user.send({
        embeds: [
          new EmbedBuilder()
            .setTitle('✅ Thank You!')
            .setDescription(`Your feedback has been recorded: ${stars}`)
            .setColor(config.embed_color)
            .setFooter({ text: config.footer_text })
            .setTimestamp(),
        ],
      });

      console.log(chalk.green(`✅ Feedback recorded: ${rating} stars from ${user.tag}`));
    } catch (error) {
      console.error(chalk.red('❌ Error recording feedback:'), error);
    }
  }

  static getAllFeedback(): FeedbackEntry[] {
    return this.loadFeedback();
  }
}
