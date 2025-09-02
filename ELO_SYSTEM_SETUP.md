# 🏒 SCS ELO System - Complete Setup Guide

This guide will walk you through setting up the complete ELO rating system that operates independently from your main SCS website.

## 📋 What We've Built

### 1. **Database Schema** (`sql/migrations/004_create_elo_system.sql`)
- Complete ELO system tables
- Player management
- Match tracking
- Lobby system
- Configurable settings

### 2. **ELO Calculator** (`lib/elo-calculator.ts`)
- Rating calculations
- K-factor adjustments
- Points system
- Tier classifications

### 3. **Discord Bot** (`discord-bot/`)
- Complete bot with all commands
- Lobby management
- Team formation
- Match processing

### 4. **Documentation**
- Comprehensive README
- Setup instructions
- Command reference

## 🚀 Step-by-Step Setup

### Phase 1: Database Setup

1. **Run the Migration**
   ```sql
   -- In your Supabase SQL editor, run:
   -- Copy and paste the contents of sql/migrations/004_create_elo_system.sql
   ```

2. **Verify Tables Created**
   - `elo_players`
   - `elo_matches`
   - `elo_match_players`
   - `elo_lobbies`
   - `elo_lobby_players`
   - `elo_settings`

### Phase 2: Discord Bot Setup

1. **Create Discord Application**
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Click "New Application"
   - Name it "SCS ELO Bot"

2. **Create Bot**
   - Go to "Bot" section
   - Click "Add Bot"
   - Copy the bot token

3. **Configure Bot Permissions**
   - Enable these intents:
     - ✅ Message Content Intent
     - ✅ Server Members Intent
     - ✅ Voice States Intent

4. **Invite Bot to Server**
   - Go to "OAuth2" → "URL Generator"
   - Select scopes: `bot`, `applications.commands`
   - Select permissions: `Send Messages`, `Read Message History`, `Use Slash Commands`
   - Copy the generated URL and open it in browser

### Phase 3: Environment Configuration

1. **Navigate to Discord Bot Directory**
   ```bash
   cd discord-bot
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Create Environment File**
   ```bash
   cp env.example .env
   ```

4. **Fill in Environment Variables**
   ```env
   DISCORD_TOKEN=your_discord_bot_token_here
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

### Phase 4: Test the System

1. **Start the Bot**
   ```bash
   npm start
   ```

2. **Test Commands in Discord**
   - `!help` - Should show all commands
   - `!register @username` - Test registration
   - `!position C` - Test position setting

## 🎮 How the System Works

### Player Flow
1. **Registration**: `!register @username`
2. **Position**: `!position C/LW/RW/D/G`
3. **Join Lobby**: `!join`
4. **Wait for 12 Players**
5. **Captains Pick Teams**
6. **Match Starts**: `!start`
7. **Report Result**: `!result <score1> <score2>`

### Technical Flow
1. **Lobby Creation**: Bot creates lobby when first player joins
2. **Player Management**: Tracks players, positions, ratings
3. **Team Formation**: Highest-rated players become captains
4. **Match Processing**: Records results, updates ratings
5. **Database Updates**: All data stored in Supabase

## 🔧 Configuration Options

### Bot Settings (in `elo-bot.js`)
```javascript
const config = {
  prefix: '!',                    // Command prefix
  lobbyTimeout: 15 * 60 * 1000,  // 15 minutes
  maxPlayers: 12,                 // Players per match
  positions: ['C', 'LW', 'RW', 'D', 'G'],
  pointsPerWin: 3,               // Points for winning
  pointsPerLoss: 0,              // Points for losing
  pointsPerDraw: 1               // Points for drawing
};
```

### Database Settings (in `elo_settings` table)
- `points_per_win`: 3
- `points_per_loss`: 0
- `points_per_draw`: 1
- `k_factor`: 32
- `min_players_for_match`: 12
- `max_players_per_team`: 6
- `lobby_timeout_minutes`: 15

## 📊 Available Commands

| Command | Usage | Description |
|---------|-------|-------------|
| `!register` | `!register @username` | Register for ELO system |
| `!position` | `!position C` | Set your position |
| `!join` | `!join` | Join a lobby |
| `!leave` | `!leave` | Leave current lobby |
| `!lobby` | `!lobby` | Show lobby status |
| `!pick` | `!pick @player` | Pick player for team |
| `!start` | `!start` | Start the match |
| `!result` | `!result 5 3` | Report match result |
| `!stats` | `!stats` | Show your stats |
| `!rankings` | `!rankings` | Show top 10 |
| `!help` | `!help` | Show all commands |

## 🏆 Rating System

### ELO Tiers
- **2400+**: Grandmaster 🥇
- **2100+**: Master 🥈
- **1800+**: Expert 🥉
- **1500+**: Advanced
- **1200+**: Intermediate
- **<1200**: Beginner

### Rating Changes
- **Winners**: +15 rating
- **Losers**: -15 rating
- **K-Factor**: Adjusts based on experience and rating

## 🚨 Troubleshooting

### Common Issues

1. **Bot Not Responding**
   - Check if bot is online
   - Verify bot permissions
   - Check console for errors

2. **Database Errors**
   - Verify Supabase credentials
   - Check if migration was run
   - Ensure service role key has permissions

3. **Commands Not Working**
   - Check bot prefix (default: `!`)
   - Verify bot permissions
   - Check if bot is in correct channel

### Debug Commands
- Check bot status: Look for "🚀 ELO Bot is ready!" in console
- Check database: Look for successful database operations in console
- Check permissions: Bot needs "Send Messages" permission

## 🔄 Maintenance

### Regular Tasks
1. **Monitor Bot Logs**: Check for errors or issues
2. **Database Backups**: Supabase handles this automatically
3. **Update Dependencies**: Run `npm update` periodically
4. **Check Bot Status**: Ensure bot stays online

### Performance Monitoring
- **Lobby Timeouts**: Default 15 minutes
- **Player Limits**: 12 players per match
- **Rating Updates**: Automatic after each match
- **Database Queries**: Optimized with proper indexes

## 🎯 Next Steps After Setup

### 1. **Test the System**
   - Register a few test players
   - Create a test lobby
   - Run through a complete match

### 2. **Customize Settings**
   - Adjust point values if needed
   - Modify lobby timeout
   - Change rating calculations

### 3. **Community Integration**
   - Announce the system to your community
   - Create a dedicated Discord channel
   - Set up regular tournaments

### 4. **Monitor and Adjust**
   - Watch for any issues
   - Gather player feedback
   - Make adjustments as needed

## 📞 Support

If you encounter issues:

1. **Check Console Logs**: Look for error messages
2. **Verify Setup**: Go through setup steps again
3. **Check Permissions**: Ensure bot has proper Discord permissions
4. **Database Issues**: Verify Supabase connection and tables

## 🎉 Success!

Once everything is working, you'll have:

- ✅ **Complete ELO System**: Independent from main site
- ✅ **Discord Integration**: Easy-to-use bot commands
- ✅ **Database Management**: All data properly stored
- ✅ **Rating System**: Fair and balanced competition
- ✅ **Lobby Management**: Smooth team formation
- ✅ **Statistics Tracking**: Individual and overall rankings

Your community can now enjoy competitive ELO matches with a professional, automated system! 🏒🎮

---

**Need help? Check the troubleshooting section or review the console logs for specific error messages.**
