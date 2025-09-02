# SCS ELO Discord Bot

A comprehensive Discord bot for managing competitive ELO rating matches in the Secret Chel Society (SCS) community.

## 🚀 Features

- **Player Registration**: `/register @username` command system
- **Position Management**: Set your hockey position (C, LW, RW, D, G)
- **Lobby System**: 12-player lobby management with automatic team formation
- **Captain Selection**: Highest-rated players become captains
- **Team Formation**: Captains pick players for balanced teams
- **Match Management**: Start matches and report results
- **ELO Rating System**: Automatic rating calculations and updates
- **Statistics Tracking**: Individual player stats and rankings
- **Points System**: Configurable points for wins/losses/draws

## 📋 Requirements

- Node.js 18.0.0 or higher
- Discord Bot Token
- Supabase Database
- Discord Server with bot permissions

## 🛠️ Installation

### 1. Clone and Setup
```bash
cd discord-bot
npm install
```

### 2. Environment Configuration
Copy `env.example` to `.env` and fill in your values:
```bash
cp env.example .env
```

Required environment variables:
- `DISCORD_TOKEN`: Your Discord bot token
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key

### 3. Database Setup
Run the SQL migration file `sql/migrations/004_create_elo_system.sql` in your Supabase database.

### 4. Discord Bot Setup
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to "Bot" section and create a bot
4. Copy the bot token to your `.env` file
5. Enable required intents:
   - Message Content Intent
   - Server Members Intent
   - Voice States Intent

### 5. Invite Bot to Server
Use this URL (replace YOUR_BOT_ID):
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_BOT_ID&permissions=274877910016&scope=bot
```

## 🎮 Commands

### Registration Commands
- `!register @username` - Register a player for ELO matches
- `!position C/LW/RW/D/G` - Set your hockey position

### Lobby Commands
- `!join` - Join a lobby (creates one if none exists)
- `!leave` - Leave current lobby
- `!lobby` - Show current lobby status

### Team Formation Commands
- `!pick @player` - Pick a player for your team (captains only)
- `!start` - Start the match (captains only)

### Match Commands
- `!result <score1> <score2>` - Report match result

### Statistics Commands
- `!stats` - Show your personal statistics
- `!rankings` - Show top 10 ELO rankings
- `!help` - Show all available commands

## 🏆 How It Works

### 1. Player Registration
Players use `!register @username` to join the system, then set their position with `!position`.

### 2. Lobby System
- Players use `!join` to enter a lobby
- Lobby automatically fills to 12 players
- Highest-rated players become captains

### 3. Team Formation
- Captains take turns picking players
- Teams are balanced by ELO ratings
- All players must be assigned to teams

### 4. Match Play
- Captains use `!start` to begin
- Teams play their match
- Use `!result <score1> <score2>` to report final score

### 5. Rating Updates
- ELO ratings are automatically calculated
- Winners gain rating, losers lose rating
- Points are awarded based on match results

## 📊 Scoring System

- **Win**: 3 points
- **Loss**: 0 points  
- **Draw**: 1 point
- **ELO Rating**: Changes based on match outcome and opponent rating

## 🎯 Positions

- **C** - Center
- **LW** - Left Wing
- **RW** - Right Wing
- **D** - Defense
- **G** - Goalie

## 🔧 Configuration

The bot can be configured through environment variables or by modifying the `config` object in `elo-bot.js`:

```javascript
const config = {
  prefix: '!',
  lobbyTimeout: 15 * 60 * 1000, // 15 minutes
  maxPlayers: 12,
  positions: ['C', 'LW', 'RW', 'D', 'G'],
  pointsPerWin: 3,
  pointsPerLoss: 0,
  pointsPerDraw: 1
};
```

## 🚀 Running the Bot

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### Using PM2 (Recommended for production)
```bash
npm install -g pm2
pm2 start elo-bot.js --name "scs-elo-bot"
pm2 save
pm2 startup
```

## 📁 File Structure

```
discord-bot/
├── elo-bot.js          # Main bot file
├── package.json         # Dependencies and scripts
├── env.example          # Environment variables template
├── README.md            # This file
└── sql/
    └── migrations/
        └── 004_create_elo_system.sql  # Database schema
```

## 🗄️ Database Schema

The bot creates and manages these tables:
- `elo_players` - Player information and ratings
- `elo_matches` - Match results and metadata
- `elo_match_players` - Individual player performance in matches
- `elo_lobbies` - Lobby management
- `elo_lobby_players` - Players in lobbies
- `elo_settings` - Configurable system settings

## 🔒 Security

- Bot uses Supabase service role key for database access
- All commands are validated and sanitized
- Rate limiting prevents spam
- Error handling prevents crashes

## 🐛 Troubleshooting

### Common Issues

1. **Bot not responding**
   - Check if bot is online
   - Verify bot has proper permissions
   - Check console for error messages

2. **Database connection errors**
   - Verify Supabase credentials
   - Check if database migration was run
   - Ensure service role key has proper permissions

3. **Commands not working**
   - Check bot prefix (default: `!`)
   - Verify bot has "Send Messages" permission
   - Check if bot is in the correct channel

### Logs
The bot logs all activities to console. Check for:
- Command execution
- Database operations
- Error messages
- Lobby status changes

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, please:
1. Check this README
2. Review console logs
3. Check Discord bot permissions
4. Verify database setup

---

**Happy Gaming! 🏒🎮**
