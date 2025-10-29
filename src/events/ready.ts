import { Client, REST, Routes } from 'discord.js';
import { ConfigHandler } from '../utils/configHandler.js';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';

export async function execute(client: Client) {
  console.log(chalk.blue('\n========================================'));
  console.log(chalk.blue('  🎫 Discord Ticket Bot'));
  console.log(chalk.blue('========================================\n'));

  console.log(chalk.green(`✅ Logged in as ${client.user?.tag}`));
  console.log(chalk.cyan(`📊 Serving ${client.guilds.cache.size} guild(s)`));

  try {
    const config = ConfigHandler.getConfig();
    
    console.log(chalk.yellow('\n⌛ Deploying slash commands...'));
    
    const commands = [];
    const commandsPath = path.join(process.cwd(), 'src', 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts'));

    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      const command = await import(filePath);
      if (command.data) {
        commands.push(command.data.toJSON());
      }
    }

    const rest = new REST({ version: '10' }).setToken(config.token);

    await rest.put(
      Routes.applicationGuildCommands(client.user!.id, config.guild_id),
      { body: commands }
    );

    console.log(chalk.green(`✅ Successfully deployed ${commands.length} slash command(s)`));
    
    console.log(chalk.blue('\n========================================'));
    console.log(chalk.green('  ✅ Bot is ready!'));
    console.log(chalk.blue('========================================\n'));
  } catch (error) {
    console.error(chalk.red('❌ Error in ready event:'), error);
  }
}
