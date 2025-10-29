import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { ConfigHandler } from './src/utils/configHandler.js';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages,
  ],
});

async function loadEvents() {
  const eventsPath = path.join(process.cwd(), 'src', 'events');
  const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.ts'));

  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = await import(filePath);
    const eventName = file.replace('.ts', '');
    
    client.on(eventName, (...args) => event.execute(...args));
    console.log(chalk.cyan(`📌 Loaded event: ${eventName}`));
  }
}

async function main() {
  try {
    console.log(chalk.yellow('⌛ Loading configuration...'));
    const config = ConfigHandler.loadConfig();
    ConfigHandler.loadPanels();

    console.log(chalk.yellow('⌛ Loading events...'));
    await loadEvents();

    console.log(chalk.yellow('⌛ Connecting to Discord...'));
    await client.login(config.token);
  } catch (error) {
    console.error(chalk.red('❌ Fatal error:'), error);
    process.exit(1);
  }
}

main();
