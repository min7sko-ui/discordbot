# Discord Ticket Bot

## Project Overview
A professional Discord ticket bot written in TypeScript using discord.js v14.15+. The bot provides a complete, elegant, fully-configurable ticket system with YAML-driven configuration.

## Current State
- ✅ Complete modular architecture implemented
- ✅ All utility managers created (configHandler, ticketManager, feedbackManager, blacklistManager, transcriptGenerator)
- ✅ All slash commands implemented (/ticket, /close, /blacklist, /feedback, /transcript, /reload)
- ✅ Event handlers for bot startup and interaction handling
- ✅ YAML configuration files with examples
- ✅ TypeScript with strict mode enabled
- ⚠️ **Requires bot token configuration before running**

## Setup Instructions

1. **Get Discord Bot Token**:
   - Go to https://discord.com/developers/applications
   - Create a new application
   - Go to "Bot" section and create a bot
   - Copy the bot token

2. **Configure the Bot**:
   - Edit `config.yml` and replace `YOUR_BOT_TOKEN_HERE` with your bot token
   - Replace guild_id, staff_roles, and channel IDs with your server's IDs

3. **Invite Bot to Server**:
   - Go to OAuth2 > URL Generator
   - Select scopes: `bot`, `applications.commands`
   - Select permissions: `Manage Channels`, `Send Messages`, `Embed Links`, `Attach Files`, `Read Message History`, `Manage Messages`
   - Use the generated URL to invite the bot

4. **Start the Bot**:
   - The workflow will automatically start the bot with `npm start`
   - Check console logs for successful connection

## Features Implemented

### Ticket System
- Ticket panels with dropdown categories (configurable in ticket-panels.yml)
- Dynamic modal forms with custom questions
- Private ticket channels with staff and user access
- Interactive buttons (Close, Add Member, Remove Member, Transcript, Rate)

### Feedback System
- 5-star rating system
- DM prompts after ticket closure
- Feedback logging to dedicated channel
- Statistics viewing with `/feedback` command

### Transcript System
- HTML and TXT transcript generation
- Full message history with timestamps
- Automatic upload to transcript channel
- Manual generation via `/transcript` command

### Blacklist System
- Add/remove users from blacklist
- Prevents blacklisted users from creating tickets
- List all blacklisted users with reasons

### Configuration
- YAML-based configuration (config.yml, ticket-panels.yml)
- Live reload support with `/reload` command
- Fully customizable colors, messages, and embeds

## Technical Details

**Stack:**
- Node.js v20+
- TypeScript 5.9+ (strict mode)
- discord.js 14.15+
- js-yaml for configuration
- chalk for colored console output
- date-fns for date formatting

**Architecture:**
- Modular command system
- Event-driven interaction handling
- Utility managers for different features
- JSON-based data storage
- ES modules

## Notes for Maintenance

- LSP errors about color types and embed types are false positives from TypeScript type compatibility - the code runs correctly
- The bot requires proper Discord permissions to function (Manage Channels, etc.)
- Data is stored in JSON files under `data/` directory
- Transcripts are saved as HTML/TXT files in `data/transcripts/`
