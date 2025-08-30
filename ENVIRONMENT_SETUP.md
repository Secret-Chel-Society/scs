# Environment Variables Setup

## Discord Bot Configuration

To keep your Discord bot credentials secure while maintaining a public repository, you need to set up environment variables.

### Required Environment Variables

Create a `.env.local` file in your project root with the following variables:

```bash
# Discord Bot Configuration
DISCORD_CLIENT_ID=1403504252508307476
DISCORD_CLIENT_ID_BOT=1403504252508307476
DISCORD_CLIENT_SECRET=your_discord_client_secret_here
DISCORD_BOT_TOKEN=your_discord_bot_token_here
DISCORD_GUILD_ID=1345946042281234442

# Other environment variables your app might need
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
NEXT_PUBLIC_SITE_URL=https://www.secretchelsociety.com
```

### Deployment Setup

For production deployment (Vercel, Netlify, etc.), add these environment variables in your hosting platform's dashboard.

### Security Notes

- Never commit the `.env.local` file to your repository
- The `.env.local` file is already in `.gitignore`
- Use different credentials for development and production
- Rotate your Discord bot token regularly

### What Changed

The code now uses environment variables instead of hardcoded secrets:
- `process.env.DISCORD_CLIENT_ID` instead of hardcoded client ID
- `process.env.DISCORD_CLIENT_SECRET` instead of hardcoded secret
- `process.env.DISCORD_BOT_TOKEN` instead of hardcoded bot token
- `process.env.DISCORD_GUILD_ID` instead of hardcoded guild ID
