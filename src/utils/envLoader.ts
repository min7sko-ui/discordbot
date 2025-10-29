import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';

export class EnvLoader {
  private static loaded = false;

  static load(): void {
    if (this.loaded) {
      return;
    }

    const envPath = path.join(process.cwd(), '.env');
    
    if (!fs.existsSync(envPath)) {
      console.log(chalk.yellow('⚠️ No .env file found. Using config.yml values or defaults.'));
      console.log(chalk.yellow('   For production, copy .env.example to .env and configure it.'));
      this.loaded = true;
      return;
    }

    try {
      const envFile = fs.readFileSync(envPath, 'utf8');
      const lines = envFile.split('\n');

      for (const line of lines) {
        // Skip empty lines and comments
        if (!line.trim() || line.trim().startsWith('#')) {
          continue;
        }

        // Parse KEY=VALUE
        const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
        if (match) {
          const [, key, value] = match;
          // Only set if not already set (allows override from actual env vars)
          if (!process.env[key]) {
            process.env[key] = value.trim();
          }
        }
      }

      console.log(chalk.green('✅ Environment variables loaded from .env'));
      this.loaded = true;
    } catch (error) {
      console.error(chalk.red('❌ Error loading .env file:'), error);
      this.loaded = true;
    }
  }

  static get(key: string, defaultValue?: string): string | undefined {
    return process.env[key] || defaultValue;
  }

  static getRequired(key: string): string {
    const value = process.env[key];
    if (!value) {
      throw new Error(`Required environment variable ${key} is not set`);
    }
    return value;
  }

  static getBoolean(key: string, defaultValue: boolean = false): boolean {
    const value = process.env[key];
    if (!value) {
      return defaultValue;
    }
    return value.toLowerCase() === 'true' || value === '1';
  }

  static getNumber(key: string, defaultValue: number = 0): number {
    const value = process.env[key];
    if (!value) {
      return defaultValue;
    }
    const num = parseInt(value, 10);
    return isNaN(num) ? defaultValue : num;
  }

  static getArray(key: string, defaultValue: string[] = []): string[] {
    const value = process.env[key];
    if (!value) {
      return defaultValue;
    }
    return value.split(',').map(v => v.trim()).filter(v => v.length > 0);
  }
}
