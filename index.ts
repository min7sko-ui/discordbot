import { Client, GatewayIntentBits, Collection, REST, Routes } from 'discord.js';
import { ConfigHandler } from './src/utils/configHandler.js';
import { Lang } from './src/utils/languageManager.js';
import { AutomationManager } from './src/utils/automationManager.js';
import { AddonManager } from './src/utils/addonManager.js';
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

async function loadCommands() {
  const commands: any[] = [];
  const commandsPath = path.join(process.cwd(), 'src', 'commands');
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = await import(filePath);
    if (command.data) {
      commands.push(command.data.toJSON());
      console.log(chalk.cyan(`📌 Loaded command: ${command.data.name}`));
    }
  }

  return commands;
}

async function registerCommands(commands: any[], config: any) {
  try {
    const rest = new REST({ version: '10' }).setToken(config.token);
    
    console.log(chalk.yellow('⌛ Registering application commands...'));
    
    await rest.put(
      Routes.applicationGuildCommands(client.user!.id, config.guild_id),
      { body: commands }
    );
    
    console.log(chalk.green(`✅ Successfully registered ${commands.length} application commands`));
  } catch (error) {
    console.error(chalk.red('❌ Error registering commands:'), error);
  }
}

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

function printBanner() {
  console.log(chalk.magenta(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║          Advanced Discord Ticket Bot v2.0                     ║
║          Production-Ready Support System                      ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
  `));
}

function runDiagnostics() {
  console.log(chalk.cyan('\n🔍 Running startup diagnostics...\n'));

  // Check for required files
  const requiredFiles = [
    'config.yml',
    'ticket-panels.yml',
    'lang/en.yml'
  ];

  const missingFiles: string[] = [];

  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      missingFiles.push(file);
      console.log(chalk.red(`  ❌ Missing: ${file}`));
    } else {
      console.log(chalk.green(`  ✅ Found: ${file}`));
    }
  }

  // Check for required directories
  const requiredDirs = ['data', 'logs', 'transcripts', 'addons'];
  
  for (const dir of requiredDirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(chalk.yellow(`  📁 Created directory: ${dir}`));
    } else {
      console.log(chalk.green(`  ✅ Directory exists: ${dir}`));
    }
  }

  if (missingFiles.length > 0) {
    console.log(chalk.red('\n⚠️ Warning: Some required files are missing. The bot may not function correctly.'));
  } else {
    console.log(chalk.green('\n✅ All required files and directories are present!'));
  }

  console.log('');
}

async function main() {
  try {
    printBanner();
    runDiagnostics();

    console.log(chalk.yellow('⌛ Loading configuration...'));
    const config = ConfigHandler.loadConfig();
    ConfigHandler.loadPanels();

    // Set language
    if (config.language) {
      Lang.setLanguage(config.language);
      console.log(chalk.green(`✅ Language set to: ${config.language}`));
    }

    console.log(chalk.yellow('⌛ Loading commands...'));
    const commands = await loadCommands();

    console.log(chalk.yellow('⌛ Loading events...'));
    await loadEvents();

    console.log(chalk.yellow('⌛ Connecting to Discord...'));
    await client.login(config.token);

    // Wait for client to be ready
    client.once('ready', async () => {
      console.log(chalk.green(`✅ Logged in as ${client.user!.tag}`));
      
      // Register commands
      await registerCommands(commands, config);

      // Start automation monitoring if enabled
      if (config.features?.auto_close) {
        AutomationManager.startMonitoring(client);
        console.log(chalk.green('✅ Automation monitoring started'));
      }

      // Load addons if enabled
      if (config.features?.addons) {
        await AddonManager.loadAll(client);
        const loadedAddons = AddonManager.getLoaded();
        console.log(chalk.green(`✅ Loaded ${loadedAddons.length} addon(s)`));
      }

      console.log(chalk.green('\n🚀 Bot is now fully operational!\n'));
      console.log(chalk.cyan(`Bot Name: ${config.bot_name || 'Advanced Support Bot'}`));
      console.log(chalk.cyan(`Guild ID: ${config.guild_id}`));
      console.log(chalk.cyan(`Language: ${config.language || 'en'}`));
      console.log(chalk.cyan(`Commands: ${commands.length}`));
      console.log(chalk.cyan(`Features Enabled:`));
      console.log(chalk.cyan(`  - Auto-Close: ${config.features?.auto_close ? '✅' : '❌'}`));
      console.log(chalk.cyan(`  - AI Responses: ${config.features?.ai_responses ? '✅' : '❌'}`));
      console.log(chalk.cyan(`  - Working Hours: ${config.features?.working_hours ? '✅' : '❌'}`));
      console.log(chalk.cyan(`  - Ticket Reviews: ${config.features?.ticket_reviews ? '✅' : '❌'}`));
      console.log(chalk.cyan(`  - Transcripts: ${config.features?.transcripts ? '✅' : '❌'}`));
      console.log(chalk.cyan(`  - Addons: ${config.features?.addons ? '✅' : '❌'}`));
      console.log('');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log(chalk.yellow('\n⚠️ Shutting down gracefully...'));
      AutomationManager.stopMonitoring();
      await client.destroy();
      console.log(chalk.green('✅ Bot shut down successfully'));
      process.exit(0);
    });

  } catch (error) {
    console.error(chalk.red('❌ Fatal error:'), error);
    process.exit(1);
  }
}

main();
