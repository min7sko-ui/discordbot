# 🎫 Advanced Discord Ticket Bot

A modern, production-ready Discord ticket support system with comprehensive features including multi-language support, automation, analytics, AI responses, and full customization.

[![Discord.js](https://img.shields.io/badge/discord.js-v14.15.3-blue.svg)](https://discord.js.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-ISC-green.svg)](LICENSE)

## ✨ Features

### Core Ticket Management
- ✅ **Fully Customizable Panels** - YAML-based configuration for unlimited ticket categories
- ✅ **Custom Modal Forms** - Configurable questions per category
- ✅ **Priority System** - Low, Medium, High, Urgent with color coding
- ✅ **Ticket Claiming** - Staff can claim tickets for ownership tracking
- ✅ **Advanced Tagging** - Custom tags for better categorization
- ✅ **Member Management** - Add/remove users from tickets

### Automation & Intelligence
- ✅ **Auto-Close System** - Automatic closure after configurable inactivity period
- ✅ **Inactivity Warnings** - Warns users before auto-closing
- ✅ **Staff Reminders** - Notifies staff of unanswered tickets
- ✅ **Working Hours** - Configurable support hours with timezone support
- ✅ **Ticket Overload Detection** - Alerts when support volume is high
- ✅ **AI Auto-Responses** - Optional AI-powered ticket responses (OpenAI, etc.)

### Analytics & Reporting
- 📊 **Comprehensive Statistics** - Total tickets, response times, ratings, and more
- 📈 **Staff Performance Tracking** - Monitor individual staff activity
- 📋 **Detailed Logging** - All ticket actions logged with timestamps
- ⭐ **Customer Feedback System** - 1-5 star ratings with optional comments
- 📄 **Transcript Generation** - Beautiful HTML or TXT transcripts

### Customization & Branding
- 🎨 **Full Embed Customization** - Colors, footers, thumbnails, banners
- 🌍 **Multi-Language Support** - Easy translation system (English included)
- 🏷️ **Custom Tags** - Define your own categorization tags
- 🎯 **Priority Colors** - Customizable colors for each priority level
- 💼 **Brand Identity** - Set bot name, footer text, and visual elements

### Developer-Friendly
- 🧩 **Addon System** - Load custom JavaScript/TypeScript modules dynamically
- 🔧 **Modular Architecture** - Clean, organized codebase
- 📦 **Docker Support** - Ready-to-deploy containerized setup
- 🔐 **Environment Variables** - Secure configuration management
- 📝 **TypeScript** - Fully typed for better development experience

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ or Docker
- Discord Bot Token ([Get one here](https://discord.com/developers/applications))
- Server with appropriate permissions

### Installation

#### Option 1: Standard Installation

```bash
# Clone the repository
git clone <repository-url>
cd discord-ticket-bot

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit configuration
nano config.yml

# Start the bot
npm start
```

#### Option 2: Docker Installation

```bash
# Copy environment file
cp .env.example .env

# Edit docker-compose.yml and .env with your settings

# Start with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f
```

---

## ⚙️ Configuration

### 1. Bot Setup

Edit `config.yml`:

```yaml
# Discord Settings
token: "YOUR_BOT_TOKEN"
guild_id: "YOUR_SERVER_ID"
staff_roles:
  - "STAFF_ROLE_ID"

# Channel IDs
ticket_category_id: "CATEGORY_ID"
feedback_channel_id: "CHANNEL_ID"
transcript_channel_id: "CHANNEL_ID"
log_channel_id: "CHANNEL_ID"

# Branding
bot_name: "Your Support Bot"
embed_color: "#5865F2"
footer_text: "Your Footer Text"
```

### 2. Ticket Panels

Edit `ticket-panels.yml` to create custom ticket categories:

```yaml
panels:
  1:
    title: "🎟️ Support Tickets"
    description: "Choose your issue below"
    color: "#5865F2"
    footer: "Support Center"
    emoji: "🎫"
    categories:
      - label: "💬 General Support"
        description: "Ask general questions"
        emoji: "💬"
        modal:
          title: "Open Support Ticket"
          questions:
            - label: "Describe your issue"
              style: "paragraph"
              required: true
```

---

## 📋 Commands

### Admin Commands
| Command | Description | Permission |
|---------|-------------|------------|
| `/ticket panel <number>` | Send a ticket panel | Manage Channels |
| `/ticket add <user>` | Add user to ticket | Manage Channels |
| `/ticket remove <user>` | Remove user from ticket | Manage Channels |
| `/stats` | View support statistics | Manage Guild |
| `/logs [limit]` | View recent ticket logs | Manage Guild |
| `/settings` | Configure bot settings | Administrator |
| `/blacklist add/remove/list <user>` | Manage blacklist | Manage Guild |

### Staff Commands
| Command | Description | Permission |
|---------|-------------|------------|
| `/claim ticket` | Claim current ticket | Manage Messages |
| `/claim unclaim` | Unclaim current ticket | Manage Messages |
| `/priority <level>` | Set ticket priority | Manage Messages |
| `/tag add/remove/list <tag>` | Manage ticket tags | Manage Messages |
| `/close [reason]` | Close ticket | Manage Messages |
| `/transcript` | Generate transcript | Manage Messages |
| `/feedback view <ticket>` | View feedback | Manage Messages |

### General Commands
| Command | Description |
|---------|-------------|
| `/reload` | Reload configuration |

---

## 🎨 Customization

### Language Files

Create `lang/<code>.yml` for additional languages:

```yaml
# lang/es.yml - Spanish
general:
  error: "❌ Ocurrió un error."
  success: "✅ Operación completada!"

ticket_create:
  created: "🎫 Tu ticket ha sido creado!"
```

### Custom Tags

Add tags in `config.yml`:

```yaml
available_tags:
  - "Billing"
  - "Technical"
  - "Bug Report"
  - "Feature Request"
  - "Refund"
```

---

## 🧩 Addon System

Create custom addons in the `/addons` directory:

```javascript
// addons/my-addon.js
export default {
  name: 'My Custom Addon',
  version: '1.0.0',
  description: 'Does something cool',
  author: 'Your Name',

  async onLoad(client) {
    console.log('Addon loaded!');
    // Add your custom functionality
  },

  async onUnload() {
    console.log('Addon unloaded!');
  }
};
```

---

## 📊 Analytics & Insights

The bot tracks comprehensive statistics:

- **Total Tickets** - All-time ticket count
- **Response Time** - Average first response time
- **Resolution Time** - Average time to close
- **Customer Ratings** - Average satisfaction score
- **Staff Performance** - Individual staff metrics
- **Category Analysis** - Busiest support categories

Access via `/stats` command.

---

## 📦 Project Structure

```
discord-ticket-bot/
├── src/
│   ├── commands/         # Slash commands
│   ├── events/           # Discord event handlers
│   ├── utils/            # Utility modules
│   └── types/            # TypeScript types
├── lang/                 # Language files
├── addons/               # Custom addons
├── data/                 # Persistent data
├── logs/                 # Log files
├── transcripts/          # Generated transcripts
├── config.yml            # Main configuration
├── ticket-panels.yml     # Ticket panel definitions
├── .env.example          # Environment template
├── Dockerfile            # Docker configuration
├── docker-compose.yml    # Docker Compose setup
└── index.ts              # Entry point
```

---

## 🐛 Troubleshooting

### Bot doesn't respond to commands
- Check bot token in `config.yml` or `.env`
- Verify bot has proper permissions
- Ensure application commands are registered

### Tickets not creating
- Check `ticket_category_id` is valid
- Verify bot can create channels in category
- Check staff roles are configured correctly

### Automation not working
- Ensure automation features are enabled in config
- Check working hours configuration
- Verify timezone settings

---

## 📝 License

ISC License - See LICENSE file for details

---

**Made with ❤️ for the Discord community**
