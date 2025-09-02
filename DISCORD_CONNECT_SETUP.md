# Discord Connect Setup Guide

## Issue
The Discord connect button is showing a 404 error because the required environment variables are not configured.

## Solution
You need to create a `.env.local` file in your project root with the Discord OAuth credentials.

## Steps

1. **Create `.env.local` file** in your project root directory (same level as `package.json`)

2. **Add the following environment variables** to `.env.local`:

```bash
# Discord OAuth Configuration
DISCORD_CLIENT_ID=1403504252508307476
DISCORD_CLIENT_SECRET=your_discord_client_secret_here

# Site URL (for OAuth redirect)
NEXT_PUBLIC_SITE_URL=https://www.secretchelsociety.com

# If you're running locally, use:
# NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

3. **Get your Discord Client Secret**:
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Select your application
   - Go to "OAuth2" section
   - Copy the "Client Secret"

4. **Restart your development server** after adding the environment variables

## What This Fixes
- The Discord connect button will no longer show 404 errors
- Users can connect their Discord accounts during registration
- Users can connect Discord accounts in their settings

## Security Note
- Never commit `.env.local` to your repository
- The file is already in `.gitignore`
- Use different credentials for development and production

## Testing
After setup, try clicking the "Connect Discord" button on the registration page. It should redirect to Discord's OAuth page instead of showing a 404 error.
