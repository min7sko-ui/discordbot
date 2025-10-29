# Advanced Discord Ticket Bot

## Project Overview
A modern, production-ready Discord ticket support system with comprehensive features including multi-language support, automation, analytics, AI responses, and full customization. Built with TypeScript and discord.js v14.15+.

## Current State - v2.0 (Production-Ready)
### ✅ Core Features
- Complete modular architecture with TypeScript strict mode
- Multi-language system with YAML-based translations (lang/ folder)
- Comprehensive YAML configuration (config.yml) with all features
- Environment variable support with .env files for security
- Docker deployment ready (Dockerfile + docker-compose.yml)
- Comprehensive README with full documentation

### ✅ Ticket Management
- Ticket panels with dropdown categories (ticket-panels.yml)
- Dynamic modal forms with custom questions
- **Priority system** (Low, Medium, High, Urgent) with colored labels
- **Ticket claiming** for staff ownership tracking
- **Advanced tagging** system for categorization
- Member add/remove functionality
- Private ticket channels with proper permissions

### ✅ Automation & Intelligence
- **Auto-close system** after configurable inactivity period
- **Inactivity warnings** sent before auto-close
- **Staff reminders** for unanswered tickets
- **Working hours** enforcement with timezone support
- **Ticket overload detection** and alerts
- **AI auto-responses** (optional, ready for integration)

### ✅ Analytics & Reporting
- **Statistics dashboard** (/stats command)
- **Comprehensive logging** with file and Discord channel logging
- **Staff performance tracking** (tickets handled, response times)
- **Customer feedback system** (1-5 star ratings)
- **Beautiful transcripts** (HTML and TXT formats)
- **Audit logs** (/logs command) for all ticket actions

### ✅ Utilities & Tools
- TicketManager - Core ticket operations
- Logger - File and Discord logging
- StatsManager - Analytics and metrics
- AutomationManager - Background automation tasks
- TranscriptGenerator - Modern HTML/TXT transcripts
- AddonManager - Custom module loading system
- LanguageManager - Multi-language support
- EnvLoader - Secure environment variable loading
- ConfigHandler - YAML + env var configuration

### ✅ Commands Implemented
**Admin Commands:**
- /ticket panel - Send ticket panels
- /ticket add/remove - Manage ticket members
- /stats - View comprehensive statistics
- /logs [limit] - View audit logs
- /settings - Interactive settings menu
- /blacklist add/remove/list - Manage blacklist

**Staff Commands:**
- /claim ticket/unclaim - Claim/unclaim tickets
- /priority <level> - Set ticket priority
- /tag add/remove/list - Manage ticket tags
- /close [reason] - Close tickets
- /transcript - Generate transcript
- /feedback view - View feedback

**General:**
- /reload - Reload configuration

## Setup Instructions

### 1. Environment Configuration
```bash
# Copy the environment template
cp .env.example .env

# Edit .env with your Discord bot credentials
nano .env
```

### 2. Required Environment Variables
- `DISCORD_TOKEN` - Your Discord bot token
- `GUILD_ID` - Your Discord server ID
- `TICKET_CATEGORY_ID` - Category for ticket channels
- `FEEDBACK_CHANNEL_ID` - Channel for feedback
- `TRANSCRIPT_CHANNEL_ID` - Channel for transcripts
- `LOG_CHANNEL_ID` - Channel for audit logs
- `STAFF_ROLES` - Comma-separated staff role IDs

### 3. Bot Permissions
Required Discord permissions:
- Manage Channels
- Send Messages
- Embed Links
- Attach Files
- Read Message History
- Manage Messages
- Use Application Commands

### 4. Start the Bot
**Option A - Standard:**
```bash
npm install
npm start
```

**Option B - Docker:**
```bash
docker-compose up -d
```

## Technical Architecture

**Stack:**
- Node.js v20+
- TypeScript 5.9+ (strict mode, ES modules)
- discord.js 14.15+
- js-yaml for YAML configuration
- chalk for colored console output
- date-fns for date formatting

**Project Structure:**
```
src/
├── commands/      # Slash command handlers
├── events/        # Discord event handlers
├── utils/         # Utility managers
└── types/         # TypeScript type definitions
lang/              # Language files (en.yml, etc.)
addons/            # Custom addon modules
data/              # Persistent JSON data
logs/              # Log files
transcripts/       # Generated transcripts
```

**Design Patterns:**
- Modular command system with dynamic loading
- Event-driven interaction handling
- Singleton utility managers
- Factory pattern for ticket creation
- Observer pattern for automation monitoring

## Configuration Files

**config.yml** - Main configuration
- Discord settings (loaded from .env for security)
- Branding (colors, footer, bot name)
- Feature toggles
- Automation settings
- Working hours schedule
- Priority colors
- Available tags

**ticket-panels.yml** - Ticket panel definitions
- Panel layouts and embeds
- Categories with labels and emojis
- Modal forms with custom questions

**lang/en.yml** - Language translations
- All user-facing text
- Easily translatable to other languages

## Security Features

- ✅ **Environment variables** - Secrets never in version control
- ✅ **EnvLoader utility** - Secure .env file parsing
- ✅ **Config validation** - Prevents insecure startup
- ✅ **Blacklist system** - Prevent abusive users
- ✅ **Permission checks** - Role-based access control
- ✅ **Audit logging** - All actions tracked
- ✅ **.gitignore** - Protects sensitive data and logs

## Deployment

**Production Checklist:**
1. ✅ Set all environment variables in .env
2. ✅ Rotate any previously exposed Discord tokens
3. ✅ Configure config.yml with your branding
4. ✅ Set up ticket-panels.yml with your categories
5. ✅ Invite bot with proper permissions
6. ✅ Run `npm start` or `docker-compose up -d`
7. ✅ Monitor logs for successful startup
8. ✅ Test ticket creation and all features

**Docker Deployment:**
- Dockerfile with Node.js 20 Alpine
- docker-compose.yml for easy orchestration
- Volume mounts for persistent data
- Environment variable injection
- Health checks and logging

## Addon System

Create custom addons in `/addons` directory:

```javascript
// addons/my-addon.js
export default {
  name: 'My Addon',
  version: '1.0.0',
  description: 'Custom functionality',
  author: 'Your Name',
  
  async onLoad(client) {
    // Initialize addon
  },
  
  async onUnload() {
    // Cleanup
  }
};
```

## Notes for Maintenance

- **Environment Variables** - Always use .env for sensitive data, never hardcode in config.yml
- **LSP Errors** - Some TypeScript type warnings about Discord.js types are false positives and don't affect runtime
- **Data Storage** - JSON files in data/ directory, automatically created on first run
- **Logging** - Both file-based (logs/) and Discord channel logging available
- **Transcripts** - Saved in transcripts/ directory, beautiful HTML format by default
- **Automation** - Background monitoring runs every minute when enabled
- **Addons** - Dynamically loaded on startup if features.addons is enabled
- **Config Reload** - Use /reload command to reload config.yml and ticket-panels.yml without restart

## Future Roadmap

Potential enhancements:
- Web dashboard for configuration
- Advanced analytics graphs
- Multi-server support
- SLA tracking
- Scheduled reports
- External ticketing API integrations (Zendesk, Freshdesk)

---

**Version:** 2.0  
**Status:** Production-Ready  
**Security:** Environment Variable Based  
**Architecture:** Modular, Scalable, Extensible
