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
      
      const embed = new EmbedBuilder()
        .setTitle('⭐ Rate Your Support Experience')
        .setDescription(config.feedback_prompt_message)
        .setColor(config.embed_color)
        .setFooter({ text: config.footer_text })
        .setTimestamp();

      await user.send({ embeds: [embed] });
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
