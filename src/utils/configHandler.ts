import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import chalk from 'chalk';
import { Config, Panels } from '../types/index.js';
import { EnvLoader } from './envLoader.js';

export class ConfigHandler {
  private static config: Config | null = null;
  private static panels: Panels | null = null;
  private static configPath = path.join(process.cwd(), 'config.yml');
  private static panelsPath = path.join(process.cwd(), 'ticket-panels.yml');

  static loadConfig(): Config {
    try {
      EnvLoader.load();

      if (!fs.existsSync(this.configPath)) {
        console.log(chalk.yellow('⚠️ config.yml not found, creating default...'));
        this.createDefaultConfig();
      }

      const fileContent = fs.readFileSync(this.configPath, 'utf8');
      const yamlConfig = yaml.load(fileContent) as any;

      this.config = this.mergeWithEnv(yamlConfig);
      
      this.validateConfig(this.config);

      console.log(chalk.green('✅ Config loaded successfully'));
      return this.config;
    } catch (error) {
      console.error(chalk.red('❌ Error loading config.yml:'), error);
      throw error;
    }
  }

  private static mergeWithEnv(yamlConfig: any): Config {
    return {
      token: EnvLoader.get('DISCORD_TOKEN') || yamlConfig.token || '',
      guild_id: EnvLoader.get('GUILD_ID') || yamlConfig.guild_id || '',
      
      staff_roles: EnvLoader.getArray('STAFF_ROLES').length > 0 
        ? EnvLoader.getArray('STAFF_ROLES') 
        : (yamlConfig.staff_roles || []),
      feedback_channel_id: EnvLoader.get('FEEDBACK_CHANNEL_ID') || yamlConfig.feedback_channel_id || '',
      
      bot_name: EnvLoader.get('BOT_NAME') || yamlConfig.bot_name || 'Support Bot',
      embed_color: EnvLoader.get('EMBED_COLOR') || yamlConfig.embed_color || '#5865F2',
      footer_text: EnvLoader.get('FOOTER_TEXT') || yamlConfig.footer_text || 'Support System © 2025',
      thumbnail_url: yamlConfig.thumbnail_url,
      banner_url: yamlConfig.banner_url,
      
      language: EnvLoader.get('LANGUAGE') || yamlConfig.language || 'en',
      
      features: {
        ai_responses: EnvLoader.getBoolean('ENABLE_AI_RESPONSES', yamlConfig.features?.ai_responses),
        auto_close: EnvLoader.getBoolean('ENABLE_AUTO_CLOSE', yamlConfig.features?.auto_close),
        ticket_reviews: EnvLoader.getBoolean('ENABLE_TICKET_REVIEWS', yamlConfig.features?.ticket_reviews),
        transcripts: EnvLoader.getBoolean('ENABLE_TRANSCRIPTS', yamlConfig.features?.transcripts),
        addons: EnvLoader.getBoolean('ENABLE_ADDONS', yamlConfig.features?.addons),
      },
      
      automation: {
        inactivity_timeout: EnvLoader.getNumber('INACTIVITY_TIMEOUT', yamlConfig.automation?.inactivity_timeout || 720),
        inactivity_warning_grace: EnvLoader.getNumber('INACTIVITY_WARNING_GRACE', yamlConfig.automation?.inactivity_warning_grace || 120),
        staff_reminder_timeout: EnvLoader.getNumber('STAFF_REMINDER_TIMEOUT', yamlConfig.automation?.staff_reminder_timeout || 60),
        max_tickets_per_user: EnvLoader.getNumber('MAX_TICKETS_PER_USER', yamlConfig.automation?.max_tickets_per_user || 3),
        ticket_overload_limit: EnvLoader.getNumber('TICKET_OVERLOAD_LIMIT', yamlConfig.automation?.ticket_overload_limit || 50),
      },
      
      transcripts: {
        format: (EnvLoader.get('TRANSCRIPT_FORMAT') || yamlConfig.transcripts?.format || 'html') as 'html' | 'txt' | 'both',
        send_to_user: yamlConfig.transcripts?.send_to_user !== false,
        send_to_staff_log: yamlConfig.transcripts?.send_to_staff_log !== false,
        include_attachments: yamlConfig.transcripts?.include_attachments !== false,
      },
      
      ai: {
        enabled: yamlConfig.ai?.enabled || false,
        provider: EnvLoader.get('AI_PROVIDER') || yamlConfig.ai?.provider,
        api_key: EnvLoader.get('AI_API_KEY') || yamlConfig.ai?.api_key,
        model: EnvLoader.get('AI_MODEL') || yamlConfig.ai?.model,
        auto_respond_delay: yamlConfig.ai?.auto_respond_delay || 5,
      },
      
      priority_colors: yamlConfig.priority_colors || {
        low: '#00ff00',
        medium: '#ffff00',
        high: '#ff8800',
        urgent: '#ff0000',
      },
      
      available_tags: yamlConfig.available_tags || ['Billing', 'Technical', 'Bug Report', 'Feature Request', 'Refund', 'Other'],
    };
  }

  private static validateConfig(config: Config): void {
    const errors: string[] = [];

    if (!config.token) {
      errors.push('Discord bot token is required (set DISCORD_TOKEN in .env or token in config.yml)');
    }

    if (!config.guild_id) {
      errors.push('Guild ID is required (set GUILD_ID in .env or guild_id in config.yml)');
    }

    if (errors.length > 0) {
      console.error(chalk.red('\n❌ Configuration errors:'));
      errors.forEach(err => console.error(chalk.red(`   - ${err}`)));
      console.error(chalk.yellow('\n💡 Tip: Copy .env.example to .env and configure your settings\n'));
      throw new Error('Invalid configuration');
    }
  }

  static loadPanels(): Panels {
    try {
      if (!fs.existsSync(this.panelsPath)) {
        console.log(chalk.yellow('⚠️ ticket-panels.yml not found, creating default...'));
        this.createDefaultPanels();
      }

      const fileContent = fs.readFileSync(this.panelsPath, 'utf8');
      this.panels = yaml.load(fileContent) as Panels;
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

  static getPanels(): Panels {
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

  static updateConfig(updates: Partial<Config>): void {
    try {
      const config = this.getConfig();
      Object.assign(config, updates);
      
      const yamlStr = yaml.dump(config, { indent: 2 });
      fs.writeFileSync(this.configPath, yamlStr);
      
      this.config = config;
      console.log(chalk.green('✅ Config updated successfully'));
    } catch (error) {
      console.error(chalk.red('❌ Error updating config:'), error);
    }
  }

  private static createDefaultConfig(): void {
    const defaultConfig: Partial<Config> = {
      token: '',
      guild_id: '',
      staff_roles: [],
      feedback_channel_id: '',
      bot_name: 'Support Bot',
      embed_color: '#5865F2',
      footer_text: 'Support System © 2025',
      language: 'en',
      features: {
        ai_responses: false,
        auto_close: true,
        ticket_reviews: true,
        transcripts: true,
        addons: true,
      },
      automation: {
        inactivity_timeout: 720,
        inactivity_warning_grace: 120,
        staff_reminder_timeout: 60,
        max_tickets_per_user: 3,
        ticket_overload_limit: 50,
      },
      priority_colors: {
        low: '#00ff00',
        medium: '#ffff00',
        high: '#ff8800',
        urgent: '#ff0000',
      },
      available_tags: ['Billing', 'Technical', 'Bug Report', 'Feature Request', 'Refund', 'Other'],
    };

    const yamlStr = yaml.dump(defaultConfig, { indent: 2 });
    fs.writeFileSync(this.configPath, yamlStr);
  }

  private static createDefaultPanels(): void {
  }
}
