const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ]
});

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Bot configuration
const config = {
  prefix: '!',
  lobbyTimeout: 15 * 60 * 1000, // 15 minutes in milliseconds
  maxPlayers: 12,
  positions: ['C', 'LW', 'RW', 'D', 'G'],
  pointsPerWin: 3,
  pointsPerLoss: 0,
  pointsPerDraw: 1
};

// Active lobbies storage
const activeLobbies = new Map();
const playerRegistrations = new Map();

// Bot ready event
client.once('ready', () => {
  console.log(`🚀 ELO Bot is ready! Logged in as ${client.user.tag}`);
  console.log(`📊 Serving ${client.guilds.cache.size} guilds`);
  
  // Set bot status
  client.user.setActivity('!help for ELO commands', { type: 'WATCHING' });
});

// Message command handler
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.content.startsWith(config.prefix)) return;

  const args = message.content.slice(config.prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  try {
    switch (command) {
      case 'register':
        await handleRegister(message, args);
        break;
      case 'position':
        await handlePosition(message, args);
        break;
      case 'join':
        await handleJoin(message, args);
        break;
      case 'leave':
        await handleLeave(message, args);
        break;
      case 'lobby':
        await handleLobby(message, args);
        break;
      case 'captain':
        await handleCaptain(message, args);
        break;
      case 'pick':
        await handlePick(message, args);
        break;
      case 'start':
        await handleStart(message, args);
        break;
      case 'result':
        await handleResult(message, args);
        break;
      case 'stats':
        await handleStats(message, args);
        break;
      case 'rankings':
        await handleRankings(message, args);
        break;
      case 'help':
        await handleHelp(message);
        break;
      default:
        await message.reply('❌ Unknown command. Use `!help` for available commands.');
    }
  } catch (error) {
    console.error('Error handling command:', error);
    await message.reply('❌ An error occurred while processing your command.');
  }
});

// Command handlers
async function handleRegister(message, args) {
  if (args.length < 1) {
    return message.reply('❌ Usage: `!register @username`');
  }

  const mentionedUser = message.mentions.users.first();
  if (!mentionedUser) {
    return message.reply('❌ Please mention a user with @username');
  }

  const discordId = mentionedUser.id;
  const discordUsername = mentionedUser.username;
  const displayName = args.slice(1).join(' ') || discordUsername;

  try {
    // Check if player already exists
    const { data: existingPlayer } = await supabase
      .from('elo_players')
      .select('id')
      .eq('discord_id', discordId)
      .single();

    if (existingPlayer) {
      return message.reply('✅ Player is already registered! Use `!position` to set your position.');
    }

    // Insert new player
    const { data: newPlayer, error } = await supabase
      .from('elo_players')
      .insert([{
        discord_id: discordId,
        discord_username: discordUsername,
        display_name: displayName,
        position: 'TBD', // Will be set with !position command
        elo_rating: 1200
      }])
      .select()
      .single();

    if (error) throw error;

    const embed = new EmbedBuilder()
      .setColor('#00ff00')
      .setTitle('🎯 Player Registered Successfully!')
      .setDescription(`**${displayName}** has been registered for ELO matches!`)
      .addFields(
        { name: 'Discord ID', value: discordId, inline: true },
        { name: 'Initial Rating', value: '1200', inline: true },
        { name: 'Next Step', value: 'Use `!position C/LW/RW/D/G` to set your position', inline: false }
      )
      .setTimestamp();

    await message.reply({ embeds: [embed] });

  } catch (error) {
    console.error('Registration error:', error);
    await message.reply('❌ Failed to register player. Please try again.');
  }
}

async function handlePosition(message, args) {
  if (args.length < 1) {
    return message.reply('❌ Usage: `!position C/LW/RW/D/G`');
  }

  const position = args[0].toUpperCase();
  if (!config.positions.includes(position)) {
    return message.reply(`❌ Invalid position. Choose from: ${config.positions.join(', ')}`);
  }

  try {
    const { data: player, error } = await supabase
      .from('elo_players')
      .update({ position: position })
      .eq('discord_id', message.author.id)
      .select()
      .single();

    if (error) throw error;

    if (!player) {
      return message.reply('❌ You must register first with `!register @username`');
    }

    const embed = new EmbedBuilder()
      .setColor('#00ff00')
      .setTitle('🎯 Position Updated!')
      .setDescription(`**${player.display_name}** is now set as **${position}**`)
      .addFields(
        { name: 'Position', value: position, inline: true },
        { name: 'Rating', value: player.elo_rating.toString(), inline: true },
        { name: 'Next Step', value: 'Use `!join` to enter a lobby', inline: false }
      )
      .setTimestamp();

    await message.reply({ embeds: [embed] });

  } catch (error) {
    console.error('Position update error:', error);
    await message.reply('❌ Failed to update position. Please try again.');
  }
}

async function handleJoin(message, args) {
  try {
    // Check if player is registered and has position set
    const { data: player, error } = await supabase
      .from('elo_players')
      .select('*')
      .eq('discord_id', message.author.id)
      .single();

    if (error || !player) {
      return message.reply('❌ You must register first with `!register @username`');
    }

    if (player.position === 'TBD') {
      return message.reply('❌ You must set your position first with `!position C/LW/RW/D/G`');
    }

    // Find or create active lobby
    let lobby = null;
    for (const [lobbyId, lobbyData] of activeLobbies) {
      if (lobbyData.status === 'waiting' && lobbyData.players.size < config.maxPlayers) {
        lobby = lobbyData;
        break;
      }
    }

    if (!lobby) {
      // Create new lobby
      lobby = {
        id: Date.now().toString(),
        status: 'waiting',
        players: new Map(),
        captains: [],
        created: Date.now(),
        channel: message.channel
      };
      activeLobbies.set(lobby.id, lobby);
    }

    // Add player to lobby
    if (lobby.players.has(message.author.id)) {
      return message.reply('❌ You are already in this lobby!');
    }

    lobby.players.set(message.author.id, {
      id: message.author.id,
      name: player.display_name,
      position: player.position,
      rating: player.elo_rating
    });

    const embed = new EmbedBuilder()
      .setColor('#00ff00')
      .setTitle('🎮 Joined Lobby!')
      .setDescription(`**${player.display_name}** joined the lobby as **${player.position}**`)
      .addFields(
        { name: 'Players', value: `${lobby.players.size}/${config.maxPlayers}`, inline: true },
        { name: 'Status', value: lobby.status, inline: true },
        { name: 'Lobby ID', value: lobby.id, inline: true }
      )
      .setTimestamp();

    await message.reply({ embeds: [embed] });

    // Check if lobby is full
    if (lobby.players.size === config.maxPlayers) {
      await handleLobbyFull(lobby);
    }

  } catch (error) {
    console.error('Join lobby error:', error);
    await message.reply('❌ Failed to join lobby. Please try again.');
  }
}

async function handleLobbyFull(lobby) {
  lobby.status = 'forming_teams';
  
  // Select captains (highest rated players)
  const sortedPlayers = Array.from(lobby.players.values())
    .sort((a, b) => b.rating - a.rating);
  
  lobby.captains = [sortedPlayers[0], sortedPlayers[1]];

  const embed = new EmbedBuilder()
    .setColor('#ffaa00')
    .setTitle('🏆 Lobby Full - Team Formation!')
    .setDescription('The lobby is now full! Captains will pick teams.')
    .addFields(
      { name: 'Captain 1', value: `${lobby.captains[0].name} (${lobby.captains[0].position}) - Rating: ${lobby.captains[0].rating}`, inline: false },
      { name: 'Captain 2', value: `${lobby.captains[1].name} (${lobby.captains[1].position}) - Rating: ${lobby.captains[1].rating}`, inline: false },
      { name: 'Next Step', value: 'Captains use `!pick @player` to select team members', inline: false }
    )
    .setTimestamp();

  await lobby.channel.send({ embeds: [embed] });

  // Start team formation timer
  setTimeout(() => {
    if (lobby.status === 'forming_teams') {
      handleLobbyTimeout(lobby);
    }
  }, config.lobbyTimeout);
}

async function handlePick(message, args) {
  if (args.length < 1) {
    return message.reply('❌ Usage: `!pick @player`');
  }

  const mentionedUser = message.mentions.users.first();
  if (!mentionedUser) {
    return message.reply('❌ Please mention a player to pick');
  }

  // Find lobby where user is captain
  let lobby = null;
  for (const [lobbyId, lobbyData] of activeLobbies) {
    if (lobbyData.captains.some(captain => captain.id === message.author.id)) {
      lobby = lobbyData;
      break;
    }
  }

  if (!lobby) {
    return message.reply('❌ You are not a captain in any active lobby');
  }

  if (lobby.status !== 'forming_teams') {
    return message.reply('❌ Team formation is not active');
  }

  // Check if player is available
  if (!lobby.players.has(mentionedUser.id)) {
    return message.reply('❌ That player is not in this lobby');
  }

  const player = lobby.players.get(mentionedUser.id);
  if (player.team) {
    return message.reply('❌ That player has already been picked');
  }

  // Assign player to captain's team
  const captainIndex = lobby.captains.findIndex(captain => captain.id === message.author.id);
  const teamNumber = captainIndex + 1;
  player.team = teamNumber;

  const embed = new EmbedBuilder()
    .setColor('#00ff00')
    .setTitle('👥 Player Picked!')
    .setDescription(`**${player.name}** (${player.position}) has been picked by **${message.author.username}**`)
    .addFields(
      { name: 'Team', value: `Team ${teamNumber}`, inline: true },
      { name: 'Position', value: player.position, inline: true },
      { name: 'Rating', value: player.rating.toString(), inline: true }
    )
    .setTimestamp();

  await message.reply({ embeds: [embed] });

  // Check if all players have been picked
  const unpickedPlayers = Array.from(lobby.players.values()).filter(p => !p.team);
  if (unpickedPlayers.length === 0) {
    await handleTeamsFormed(lobby);
  }
}

async function handleTeamsFormed(lobby) {
  lobby.status = 'teams_formed';

  const team1Players = Array.from(lobby.players.values()).filter(p => p.team === 1);
  const team2Players = Array.from(lobby.players.values()).filter(p => p.team === 2);

  const embed = new EmbedBuilder()
    .setColor('#00ff00')
    .setTitle('🏆 Teams Formed Successfully!')
    .setDescription('Both teams are ready! Use `!start` to begin the match.')
    .addFields(
      { name: 'Team 1', value: team1Players.map(p => `${p.name} (${p.position})`).join('\n'), inline: true },
      { name: 'Team 2', value: team2Players.map(p => `${p.name} (${p.position})`).join('\n'), inline: true }
    )
    .setTimestamp();

  await lobby.channel.send({ embeds: [embed] });
}

async function handleStart(message, args) {
  // Find lobby where user is captain
  let lobby = null;
  for (const [lobbyId, lobbyData] of activeLobbies) {
    if (lobbyData.captains.some(captain => captain.id === message.author.id)) {
      lobby = lobbyData;
      break;
    }
  }

  if (!lobby) {
    return message.reply('❌ You are not a captain in any active lobby');
  }

  if (lobby.status !== 'teams_formed') {
    return message.reply('❌ Teams must be fully formed before starting');
  }

  lobby.status = 'in_progress';
  lobby.started = Date.now();

  const embed = new EmbedBuilder()
    .setColor('#ff0000')
    .setTitle('🚀 Match Started!')
    .setDescription('The match is now in progress! Use `!result` to report the final score.')
    .addFields(
      { name: 'Status', value: 'Match in progress', inline: true },
      { name: 'Started', value: new Date().toLocaleTimeString(), inline: true }
    )
    .setTimestamp();

  await message.reply({ embeds: [embed] });
}

async function handleResult(message, args) {
  if (args.length < 2) {
    return message.reply('❌ Usage: `!result <team1_score> <team2_score>`');
  }

  const team1Score = parseInt(args[0]);
  const team2Score = parseInt(args[1]);

  if (isNaN(team1Score) || isNaN(team2Score)) {
    return message.reply('❌ Scores must be valid numbers');
  }

  // Find active match for this user
  let lobby = null;
  for (const [lobbyId, lobbyData] of activeLobbies) {
    if (lobbyData.players.has(message.author.id) && lobbyData.status === 'in_progress') {
      lobby = lobbyData;
      break;
    }
  }

  if (!lobby) {
    return message.reply('❌ You are not in an active match');
  }

  try {
    // Process match result
    await processMatchResult(lobby, team1Score, team2Score);
    
    // Clean up lobby
    activeLobbies.delete(lobby.id);

    const embed = new EmbedBuilder()
      .setColor('#00ff00')
      .setTitle('🏁 Match Complete!')
      .setDescription(`Final Score: **Team 1** ${team1Score} - ${team2Score} **Team 2**`)
      .addFields(
        { name: 'Winner', value: team1Score > team2Score ? 'Team 1' : 'Team 2', inline: true },
        { name: 'Duration', value: `${Math.round((Date.now() - lobby.started) / 60000)} minutes`, inline: true }
      )
      .setTimestamp();

    await message.reply({ embeds: [embed] });

  } catch (error) {
    console.error('Match result error:', error);
    await message.reply('❌ Failed to process match result. Please try again.');
  }
}

async function processMatchResult(lobby, team1Score, team2Score) {
  const winner = team1Score > team2Score ? 1 : 2;
  const matchDuration = Math.round((Date.now() - lobby.started) / 1000);

  // Create match record
  const { data: match, error: matchError } = await supabase
    .from('elo_matches')
    .insert([{
      team1_score: team1Score,
      team2_score: team2Score,
      winner_team: winner,
      match_duration: matchDuration
    }])
    .select()
    .single();

  if (matchError) throw matchError;

  // Process individual player results
  for (const [playerId, player] of lobby.players) {
    const isWinner = player.team === winner;
    
    // Calculate rating change (simplified for team games)
    const ratingChange = isWinner ? 15 : -15;
    const newRating = Math.max(0, player.rating + ratingChange);
    
    // Update player stats
    const { error: updateError } = await supabase
      .from('elo_players')
      .update({
        elo_rating: newRating,
        total_matches: player.total_matches + 1,
        wins: player.wins + (isWinner ? 1 : 0),
        losses: player.losses + (isWinner ? 0 : 1),
        points_earned: player.points_earned + (isWinner ? config.pointsPerWin : config.pointsPerLoss),
        last_match_at: new Date().toISOString()
      })
      .eq('discord_id', playerId);

    if (updateError) throw updateError;

    // Create match player record
    const { error: matchPlayerError } = await supabase
      .from('elo_match_players')
      .insert([{
        match_id: match.id,
        player_id: playerId,
        team_number: player.team,
        position: player.position,
        rating_before: player.rating,
        rating_after: newRating,
        rating_change: ratingChange,
        points_earned: isWinner ? config.pointsPerWin : config.pointsPerLoss
      }]);

    if (matchPlayerError) throw matchPlayerError;
  }
}

async function handleStats(message, args) {
  try {
    const { data: player, error } = await supabase
      .from('elo_players')
      .select('*')
      .eq('discord_id', message.author.id)
      .single();

    if (error || !player) {
      return message.reply('❌ You are not registered. Use `!register @username` first.');
    }

    const winPercentage = ((player.wins / Math.max(1, player.total_matches)) * 100).toFixed(1);
    const tier = getRatingTier(player.elo_rating);

    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle(`📊 Stats for ${player.display_name}`)
      .setThumbnail(message.author.displayAvatarURL())
      .addFields(
        { name: 'Rating', value: player.elo_rating.toString(), inline: true },
        { name: 'Tier', value: tier, inline: true },
        { name: 'Position', value: player.position, inline: true },
        { name: 'Matches', value: player.total_matches.toString(), inline: true },
        { name: 'Wins', value: player.wins.toString(), inline: true },
        { name: 'Losses', value: player.losses.toString(), inline: true },
        { name: 'Win Rate', value: `${winPercentage}%`, inline: true },
        { name: 'Points Earned', value: player.points_earned.toString(), inline: true },
        { name: 'Highest Rating', value: player.highest_rating.toString(), inline: true }
      )
      .setTimestamp();

    await message.reply({ embeds: [embed] });

  } catch (error) {
    console.error('Stats error:', error);
    await message.reply('❌ Failed to fetch stats. Please try again.');
  }
}

async function handleRankings(message, args) {
  try {
    const { data: players, error } = await supabase
      .from('elo_players')
      .select('*')
      .order('elo_rating', { ascending: false })
      .limit(10);

    if (error) throw error;

    const embed = new EmbedBuilder()
      .setColor('#ffd700')
      .setTitle('🏆 Top 10 ELO Rankings')
      .setDescription('The highest rated players in the system');

    let description = '';
    players.forEach((player, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
      const tier = getRatingTier(player.elo_rating);
      description += `${medal} **${player.display_name}** - ${player.elo_rating} (${tier})\n`;
    });

    embed.setDescription(description);
    embed.setTimestamp();

    await message.reply({ embeds: [embed] });

  } catch (error) {
    console.error('Rankings error:', error);
    await message.reply('❌ Failed to fetch rankings. Please try again.');
  }
}

async function handleHelp(message) {
  const embed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle('🤖 ELO System Commands')
    .setDescription('Here are all available commands:')
    .addFields(
      { name: '🎯 Registration', value: '`!register @username` - Register for ELO matches\n`!position C/LW/RW/D/G` - Set your position', inline: false },
      { name: '🎮 Lobby System', value: '`!join` - Join a lobby\n`!leave` - Leave current lobby\n`!lobby` - Show lobby status', inline: false },
      { name: '👥 Team Formation', value: '`!captain` - Show captain info\n`!pick @player` - Pick a player for your team\n`!start` - Start the match', inline: false },
      { name: '🏁 Match Results', value: '`!result <score1> <score2>` - Report match result', inline: false },
      { name: '📊 Statistics', value: '`!stats` - Show your stats\n`!rankings` - Show top 10 rankings', inline: false },
      { name: '❓ Help', value: '`!help` - Show this help message', inline: false }
    )
    .addFields(
      { name: '📋 Positions', value: 'C (Center), LW (Left Wing), RW (Right Wing), D (Defense), G (Goalie)', inline: false },
      { name: '🏆 Scoring', value: `Win: ${config.pointsPerWin} points, Loss: ${config.pointsPerLoss} points, Draw: ${config.pointsPerDraw} points`, inline: false }
    )
    .setTimestamp();

  await message.reply({ embeds: [embed] });
}

// Utility functions
function getRatingTier(rating) {
  if (rating >= 2400) return 'Grandmaster';
  if (rating >= 2100) return 'Master';
  if (rating >= 1800) return 'Expert';
  if (rating >= 1500) return 'Advanced';
  if (rating >= 1200) return 'Intermediate';
  return 'Beginner';
}

async function handleLobbyTimeout(lobby) {
  lobby.status = 'cancelled';
  
  const embed = new EmbedBuilder()
    .setColor('#ff0000')
    .setTitle('⏰ Lobby Timed Out')
    .setDescription('The lobby timed out due to inactivity. Players can join a new lobby.')
    .setTimestamp();

  await lobby.channel.send({ embeds: [embed] });
  
  activeLobbies.delete(lobby.id);
}

async function handleLeave(message) {
  // Find and remove player from lobby
  for (const [lobbyId, lobby] of activeLobbies) {
    if (lobby.players.has(message.author.id)) {
      lobby.players.delete(message.author.id);
      
      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('👋 Player Left Lobby')
        .setDescription(`${message.author.username} left the lobby`)
        .addFields(
          { name: 'Players Remaining', value: `${lobby.players.size}/${config.maxPlayers}`, inline: true }
        )
        .setTimestamp();

      await message.reply({ embeds: [embed] });

      // If lobby becomes empty, remove it
      if (lobby.players.size === 0) {
        activeLobbies.delete(lobbyId);
      }
      
      return;
    }
  }

  await message.reply('❌ You are not in any active lobby');
}

async function handleLobby(message, args) {
  // Find active lobby for this channel
  let lobby = null;
  for (const [lobbyId, lobbyData] of activeLobbies) {
    if (lobbyData.channel.id === message.channel.id) {
      lobby = lobbyData;
      break;
    }
  }

  if (!lobby) {
    return message.reply('❌ No active lobby in this channel. Use `!join` to create one.');
  }

  const players = Array.from(lobby.players.values());
  const team1Players = players.filter(p => p.team === 1);
  const team2Players = players.filter(p => p.team === 2);
  const unpickedPlayers = players.filter(p => !p.team);

  const embed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle('🎮 Lobby Status')
    .addFields(
      { name: 'Status', value: lobby.status, inline: true },
      { name: 'Players', value: `${players.length}/${config.maxPlayers}`, inline: true },
      { name: 'Lobby ID', value: lobby.id, inline: true }
    );

  if (lobby.status === 'waiting') {
    embed.addFields(
      { name: 'Waiting for Players', value: `${config.maxPlayers - players.length} more needed`, inline: false }
    );
  } else if (lobby.status === 'forming_teams') {
    embed.addFields(
      { name: 'Captain 1', value: lobby.captains[0]?.name || 'None', inline: true },
      { name: 'Captain 2', value: lobby.captains[1]?.name || 'None', inline: true },
      { name: 'Unpicked Players', value: unpickedPlayers.map(p => `${p.name} (${p.position})`).join('\n') || 'None', inline: false }
    );
  } else if (lobby.status === 'teams_formed') {
    embed.addFields(
      { name: 'Team 1', value: team1Players.map(p => `${p.name} (${p.position})`).join('\n'), inline: true },
      { name: 'Team 2', value: team2Players.map(p => `${p.name} (${p.position})`).join('\n'), inline: true }
    );
  }

  embed.setTimestamp();
  await message.reply({ embeds: [embed] });
}

// Error handling
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

// Login to Discord
client.login(process.env.DISCORD_TOKEN);

module.exports = { client, config, activeLobbies };
