import * as fs from 'fs';
import * as path from 'path';
import { Client } from 'discord.js';
import chalk from 'chalk';

export interface Addon {
  name: string;
  version: string;
  description: string;
  author?: string;
  onLoad?: (client: Client) => void | Promise<void>;
  onUnload?: () => void | Promise<void>;
}

export class AddonManager {
  private static addonsDir = path.join(process.cwd(), 'addons');
  private static loadedAddons: Map<string, Addon> = new Map();

  static {
    if (!fs.existsSync(this.addonsDir)) {
      fs.mkdirSync(this.addonsDir, { recursive: true });
      
      // Create example addon
      const exampleAddon = `// Example Addon for Advanced Ticket Bot
// Place your custom addons in the /addons directory

export default {
  name: 'Example Addon',
  version: '1.0.0',
  description: 'An example addon showing the structure',
  author: 'Your Name',

  // Called when addon is loaded
  async onLoad(client) {
    console.log('Example addon loaded!');
    
    // You can add custom commands, event listeners, etc.
    // Example: client.on('messageCreate', (message) => { ... });
  },

  // Called when addon is unloaded
  async onUnload() {
    console.log('Example addon unloaded!');
  }
};
`;
      fs.writeFileSync(
        path.join(this.addonsDir, 'example-addon.js'),
        exampleAddon
      );
    }
  }

  static async loadAll(client: Client): Promise<void> {
    try {
      const files = fs.readdirSync(this.addonsDir).filter(
        file => (file.endsWith('.js') || file.endsWith('.ts')) && !file.startsWith('example')
      );

      console.log(chalk.cyan(`🧩 Loading addons from ${this.addonsDir}...`));

      for (const file of files) {
        await this.load(file, client);
      }

      console.log(chalk.green(`✅ Loaded ${this.loadedAddons.size} addon(s)`));
    } catch (error) {
      console.error(chalk.red('❌ Error loading addons:'), error);
    }
  }

  static async load(filename: string, client: Client): Promise<boolean> {
    try {
      const addonPath = path.join(this.addonsDir, filename);
      
      if (!fs.existsSync(addonPath)) {
        console.error(chalk.red(`❌ Addon file not found: ${filename}`));
        return false;
      }

      // Import the addon
      const addonModule = await import(addonPath);
      const addon: Addon = addonModule.default;

      if (!addon.name || !addon.version) {
        console.error(chalk.red(`❌ Invalid addon structure: ${filename}`));
        return false;
      }

      // Call onLoad if it exists
      if (addon.onLoad) {
        await addon.onLoad(client);
      }

      this.loadedAddons.set(addon.name, addon);
      console.log(chalk.green(`✅ Loaded addon: ${addon.name} v${addon.version}`));
      return true;
    } catch (error) {
      console.error(chalk.red(`❌ Error loading addon ${filename}:`), error);
      return false;
    }
  }

  static async unload(addonName: string): Promise<boolean> {
    try {
      const addon = this.loadedAddons.get(addonName);
      
      if (!addon) {
        console.error(chalk.red(`❌ Addon not found: ${addonName}`));
        return false;
      }

      // Call onUnload if it exists
      if (addon.onUnload) {
        await addon.onUnload();
      }

      this.loadedAddons.delete(addonName);
      console.log(chalk.green(`✅ Unloaded addon: ${addonName}`));
      return true;
    } catch (error) {
      console.error(chalk.red(`❌ Error unloading addon ${addonName}:`), error);
      return false;
    }
  }

  static getLoaded(): Addon[] {
    return Array.from(this.loadedAddons.values());
  }

  static isLoaded(addonName: string): boolean {
    return this.loadedAddons.has(addonName);
  }

  static async reloadAll(client: Client): Promise<void> {
    console.log(chalk.yellow('🔄 Reloading all addons...'));
    
    // Unload all
    for (const [name] of this.loadedAddons) {
      await this.unload(name);
    }

    // Load all again
    await this.loadAll(client);
  }
}
