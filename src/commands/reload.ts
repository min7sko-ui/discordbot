import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
} from 'discord.js';
import { ConfigHandler } from '../utils/configHandler.js';
import chalk from 'chalk';

export const data = new SlashCommandBuilder()
  .setName('reload')
  .setDescription('Reload configuration files without restarting the bot')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    await interaction.reply({
      content: '⌛ Reloading configuration...',
      ephemeral: true,
    });

    ConfigHandler.reload();

    const config = ConfigHandler.getConfig();

    const embed = new EmbedBuilder()
      .setTitle('✅ Configuration Reloaded')
      .setDescription(
        'All configuration files have been reloaded successfully.\n\n' +
          '**Reloaded:**\n• config.yml\n• ticket-panels.yml'
      )
      .setColor(config.embed_color)
      .setFooter({ text: config.footer_text })
      .setTimestamp();

    await interaction.editReply({ content: '', embeds: [embed] });
    console.log(chalk.green(`✅ Configuration reloaded by ${interaction.user.tag}`));
  } catch (error) {
    console.error(chalk.red('❌ Error in reload command:'), error);
    await interaction.editReply({
      content: '❌ An error occurred while reloading the configuration.',
    });
  }
}
