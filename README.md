# 🎫 Discord Ticket Bot

A professional, production-ready Discord ticket bot built in TypeScript with full YAML-driven configuration, featuring ticket panels, modals, transcripts, feedback system, and blacklist management.

## ✨ Features

- **Fully Customizable Ticket Panels** - Define ticket categories and modal questions in `ticket-panels.yml`
- **Dynamic Modal Forms** - Create custom forms with short and paragraph text inputs
- **Private Ticket Channels** - Automatically creates channels with staff and user access
- **5-Star Feedback System** - Collects user ratings after ticket closure via DM
- **HTML/TXT Transcripts** - Generates beautiful transcripts with full message history
- **User Blacklist** - Prevent abuse with blacklist management commands
- **Live Configuration Reload** - Update settings without restarting the bot
- **Professional UI/UX** - Discord's blurple theme with consistent embeds and emojis

## 🚀 Quick Start

### 1. Configure Your Bot

Edit `config.yml` with your Discord bot credentials:

```yaml
token: "YOUR_BOT_TOKEN_HERE"
guild_id: "YOUR_GUILD_ID_HERE"

staff_roles:
  - "YOUR_STAFF_ROLE_ID_HERE"

ticket_category_id: "YOUR_CATEGORY_ID_HERE"
feedback_channel_id: "YOUR_FEEDBACK_CHANNEL_ID_HERE"
transcript_channel_id: "YOUR_TRANSCRIPT_CHANNEL_ID_HERE"
```

### 2. Customize Ticket Panels

Edit `ticket-panels.yml` to define your ticket categories and modal questions.

### 3. Install Dependencies

```bash
npm install
```

### 4. Start the Bot

```bash
npm start
```

## 📋 Commands

| Command | Description |
|---------|-------------|
| `/ticket panel send <number>` | Send a ticket panel from ticket-panels.yml |
| `/close` | Close the current ticket (staff only) |
| `/blacklist add <user> [reason]` | Add user to blacklist |
| `/blacklist remove <user>` | Remove user from blacklist |
| `/blacklist list` | Show all blacklisted users |
| `/reload` | Reload configuration files |
| `/feedback` | View feedback statistics |
| `/transcript` | Generate transcript for current ticket |

## 📁 Project Structure

```
.
├── src/
│   ├── commands/          # Slash command handlers
│   ├── events/            # Discord event handlers
│   └── utils/             # Utility managers
├── data/
│   ├── tickets.json       # Active ticket data
│   ├── blacklist.json     # Blacklisted users
│   ├── feedback.json      # User feedback ratings
│   └── transcripts/       # Generated transcripts
├── config.yml             # Main configuration
├── ticket-panels.yml      # Ticket panel definitions
└── index.ts               # Bot entry point
```

## ⚙️ Configuration

All colors, messages, and embeds can be customized in `config.yml`. Ticket panels, categories, and modal questions are defined in `ticket-panels.yml`.

## 🎨 Customization

The bot uses Discord's blurple color (`#5865F2`) by default. You can customize:

- Embed colors
- Footer text
- Messages
- Panel layouts
- Modal questions
- Button labels (in code)

## 📝 License

ISC

---

**Made with ❤️ and TypeScript**
