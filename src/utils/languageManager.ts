import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import chalk from 'chalk';

interface TranslationData {
  [key: string]: string | TranslationData;
}

class LanguageManager {
  private static instance: LanguageManager;
  private currentLanguage: string = 'en';
  private translations: Map<string, TranslationData> = new Map();

  private constructor() {
    this.loadLanguage('en');
  }

  public static getInstance(): LanguageManager {
    if (!LanguageManager.instance) {
      LanguageManager.instance = new LanguageManager();
    }
    return LanguageManager.instance;
  }

  private loadLanguage(lang: string): void {
    try {
      const langPath = path.join(process.cwd(), 'lang', `${lang}.yml`);
      
      if (!fs.existsSync(langPath)) {
        console.log(chalk.yellow(`⚠️ Language file ${lang}.yml not found, using default (en)`));
        return;
      }

      const fileContent = fs.readFileSync(langPath, 'utf8');
      const data = yaml.load(fileContent) as TranslationData;
      
      this.translations.set(lang, data);
      console.log(chalk.green(`✅ Loaded language: ${lang}`));
    } catch (error) {
      console.error(chalk.red(`❌ Error loading language ${lang}:`), error);
    }
  }

  public setLanguage(lang: string): boolean {
    if (!this.translations.has(lang)) {
      this.loadLanguage(lang);
    }

    if (this.translations.has(lang)) {
      this.currentLanguage = lang;
      return true;
    }

    return false;
  }

  public getCurrentLanguage(): string {
    return this.currentLanguage;
  }

  public translate(key: string, replacements?: { [key: string]: string }): string {
    const keys = key.split('.');
    let value: any = this.translations.get(this.currentLanguage);

    if (!value) {
      return key;
    }

    for (const k of keys) {
      value = value[k];
      if (value === undefined) {
        console.log(chalk.yellow(`⚠️ Translation key not found: ${key}`));
        return key;
      }
    }

    let result = String(value);

    if (replacements) {
      Object.entries(replacements).forEach(([placeholder, replacement]) => {
        result = result.replace(new RegExp(`\\{${placeholder}\\}`, 'g'), replacement);
      });
    }

    return result;
  }

  public t(key: string, replacements?: { [key: string]: string }): string {
    return this.translate(key, replacements);
  }

  public getAvailableLanguages(): string[] {
    const langDir = path.join(process.cwd(), 'lang');
    
    if (!fs.existsSync(langDir)) {
      return ['en'];
    }

    return fs
      .readdirSync(langDir)
      .filter(file => file.endsWith('.yml'))
      .map(file => file.replace('.yml', ''));
  }
}

export const Lang = LanguageManager.getInstance();
