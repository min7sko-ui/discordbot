import * as fs from 'fs';
import * as yaml from 'js-yaml';
import chalk from 'chalk';

export interface Config {
  token: string;
  guild_id: string;
  staff_roles: string[];
  ticket_category_id: string;
  feedback_channel_id: string;
  transcript_channel_id: string;
  embed_color: string;
  footer_text: string;
  blacklist_message: string;
  close_ticket_message: string;
  ticket_created_message: string;
  feedback_prompt_message: string;
}

export interface TicketPanel {
  title: string;
  description: string;
  color: string;
  footer: string;
  emoji: string;
  categories: Array<{
    label: string;
    description: string;
    emoji: string;
    modal: {
      title: string;
      questions: Array<{
        label: string;
        style: 'short' | 'paragraph';
        required: boolean;
      }>;
    };
  }>;
}

export interface TicketPanels {
  panels: Record<number, TicketPanel>;
}

export class ConfigHandler {
  private static config: Config | null = null;
  private static panels: TicketPanels | null = null;

  static loadConfig(): Config {
    try {
      const fileContent = fs.readFileSync('config.yml', 'utf8');
      this.config = yaml.load(fileContent) as Config;
      console.log(chalk.green('✅ Config loaded successfully'));
      return this.config;
    } catch (error) {
      console.error(chalk.red('❌ Error loading config.yml:'), error);
      throw error;
    }
  }

  static loadPanels(): TicketPanels {
    try {
      const fileContent = fs.readFileSync('ticket-panels.yml', 'utf8');
      this.panels = yaml.load(fileContent) as TicketPanels;
      console.log(chalk.green('✅ Ticket panels loaded successfully'));
      return this.panels;
    } catch (error) {
      console.error(chalk.red('❌ Error loading ticket-panels.yml:'), error);
      throw error;
    }
  }

  static getConfig(): Config {
    if (!this.config) {
      return this.loadConfig();
    }
    return this.config;
  }

  static getPanels(): TicketPanels {
    if (!this.panels) {
      return this.loadPanels();
    }
    return this.panels;
  }

  static reload(): void {
    console.log(chalk.yellow('🔄 Reloading configuration...'));
    this.config = null;
    this.panels = null;
    this.loadConfig();
    this.loadPanels();
    console.log(chalk.green('✅ Configuration reloaded successfully'));
  }
}
