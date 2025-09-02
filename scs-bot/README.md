# SCS Discord Bot

This Discord bot handles role management for SCS.

## Features

- **Automatic Role Assignment**: Assigns roles based on team membership and positions
- **Account Linking**: Allows users to link their Discord to MGHL accounts
- **Real-time Sync**: Keeps Discord roles in sync with website changes

## Setup

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Set environment variables:
\`\`\`bash
export NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
\`\`\`

3. Run the bot:
\`\`\`bash
npm start
\`\`\`

## Commands

- `!link <scs-username>` - Link Discord account to SCS account

## Bot Permissions Required

- Manage Roles
- Read Messages
- Send Messages
- View Channels
- Read Message History
\`\`\`

Now you need to:

1. **Set up the bot files** in a separate directory
2. **Install Node.js dependencies** (`npm install` in the discord-bot folder)
3. **Run the bot** (`npm start`)
4. **Invite the bot to your Discord server** with proper permissions

The bot will:
- Come online in Discord
- Automatically sync roles when it starts
- Handle new member joins
- Monitor for account linking commands
- Check Twitch streams periodically

Once the bot is running, the "Sync All Roles" button in your admin panel should work properly!
