require("dotenv").config();
console.log("SUPABASE_URL:", process.env.SUPABASE_URL);
const { Client, GatewayIntentBits } = require("discord.js");
const { createClient } = require("@supabase/supabase-js");

// Load credentials from environment variables
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = "1345946042281234442";
const REGISTERED_ROLE_ID = "376351990354804848";
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Supabase setup
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Discord client setup
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once("ready", async () => {
  console.log(`✅ SCS Bot is online as ${client.user.tag}`);
  console.log(`🏒 Connected to guild: ${client.guilds.cache.get(GUILD_ID)?.name}`);
  client.user.setActivity("SCS Hockey League", { type: "WATCHING" });

  await syncAllUserRoles();
  setInterval(checkTwitchStreams, 5 * 60 * 1000);
});

client.on("guildMemberAdd", async (member) => {
  if (member.guild.id !== GUILD_ID) return;

  try {
    const { data: discordUser } = await supabase
      .from("discord_users")
      .select("*")
      .eq("discord_id", member.id)
      .single();

    if (discordUser) {
      await member.roles.add(REGISTERED_ROLE_ID);
      console.log(`✅ Assigned registered role to ${member.user.tag}`);
      await syncUserRoles(member.id);
    }
  } catch (error) {
    console.error(`❌ Error handling member join for ${member.user.tag}:`, error);
  }
});

async function syncAllUserRoles() {
  try {
    console.log("🔄 Starting role synchronization...");

    const { data: discordUsers, error } = await supabase
      .from("discord_users")
      .select(`
        *,
        users(
          id,
          gamer_tag_id,
          players(
            role,
            team_id,
            teams:teams(name)
          ),
          user_roles(role)
        )
      `);

    if (error) {
      console.error("❌ Error fetching Discord users:", error);
      return;
    }

    const guild = client.guilds.cache.get(GUILD_ID);
    if (!guild) {
      console.error("❌ Guild not found");
      return;
    }

    const { data: teamRoles } = await supabase.from("discord_team_roles").select("*");
    const { data: managementRoles } = await supabase.from("discord_management_roles").select("*");

    let syncedCount = 0;

    for (const discordUser of discordUsers) {
      try {
        await syncUserRoles(discordUser.discord_id, discordUser.users, teamRoles, managementRoles);
        syncedCount++;
        await new Promise((resolve) => setTimeout(resolve, 5000));
      } catch (error) {
        console.error(`❌ Error syncing roles for ${discordUser.discord_username}:`, error);
      }
    }

    console.log(`✅ Synced roles for ${syncedCount} users`);
  } catch (error) {
    console.error("❌ Error in role synchronization:", error);
  }
}

async function syncUserRoles(discordId, userData = null, teamRoles = null, managementRoles = null) {
  try {
    const guild = client.guilds.cache.get(GUILD_ID);
    const member = await guild.members.fetch(discordId);
    if (!member) return;

    if (!userData) {
      const { data: discordUser } = await supabase
        .from("discord_users")
        .select(`
          users(
            id,
            gamer_tag_id,
            players(
              role,
              team_id,
              teams:teams(name)
            ),
            user_roles(role)
          )
        `)
        .eq("discord_id", discordId)
        .single();

      userData = discordUser?.users;
    }

    if (!userData) return;

    if (!teamRoles) {
      const { data } = await supabase.from("discord_team_roles").select("*");
      teamRoles = data || [];
    }

    if (!managementRoles) {
      const { data } = await supabase.from("discord_management_roles").select("*");
      managementRoles = data || [];
    }

    const rolesToAdd = [];
    const rolesToRemove = [];

    if (REGISTERED_ROLE_ID && !member.roles.cache.has(REGISTERED_ROLE_ID)) {
      rolesToAdd.push(REGISTERED_ROLE_ID);
    }

    if (userData.players?.[0]?.team_id) {
      const teamRole = teamRoles.find((role) => role.team_id === userData.players[0].team_id);
      if (teamRole && !member.roles.cache.has(teamRole.discord_role_id)) {
        rolesToAdd.push(teamRole.discord_role_id);
      }
    }

    const playerRole = userData.players?.[0]?.role;
    if (playerRole && ["Owner", "GM", "AGM"].includes(playerRole)) {
      const managementRole = managementRoles.find((role) => role.role_type === playerRole);
      if (managementRole && !member.roles.cache.has(managementRole.discord_role_id)) {
        rolesToAdd.push(managementRole.discord_role_id);
      }
    }

    const hasAdminRole = userData.user_roles?.some((role) => role.role === "Admin");
    if (hasAdminRole) {
      const adminRole = managementRoles.find((role) => role.role_type === "Admin");
      if (adminRole && !member.roles.cache.has(adminRole.discord_role_id)) {
        rolesToAdd.push(adminRole.discord_role_id);
      }
    }

    const allMGHLRoles = [
      REGISTERED_ROLE_ID,
      ...teamRoles.map((r) => r.discord_role_id),
      ...managementRoles.map((r) => r.discord_role_id),
    ].filter(Boolean);

    for (const roleId of member.roles.cache.keys()) {
      if (allMGHLRoles.includes(roleId) && !rolesToAdd.includes(roleId) && roleId !== REGISTERED_ROLE_ID) {
        rolesToRemove.push(roleId);
      }
    }

    if (rolesToAdd.length > 0) {
      await member.roles.add(rolesToAdd);
      console.log(`✅ Added roles to ${member.user.tag}: ${rolesToAdd.join(", ")}`);
    }

    if (rolesToRemove.length > 0) {
      await member.roles.remove(rolesToRemove);
      console.log(`🗑️ Removed roles from ${member.user.tag}: ${rolesToRemove.join(", ")}`);
    }
  } catch (error) {
    console.error(`❌ Error syncing roles for user ${discordId}:`, error);
  }
}

client.on("messageCreate", async (message) => {
  if (message.author.bot || message.guild?.id !== GUILD_ID) return;

  if (message.content.startsWith("!link")) {
    const args = message.content.split(" ");
    if (args.length < 2) {
      message.reply("Usage: !link <your-scs-username>");
      return;
    }

    const mghlUsername = args[1];

    try {
      const { data: user } = await supabase
        .from("users")
        .select("*")
        .eq("gamer_tag_id", ScsUsername)
        .single();

      if (!user) {
        message.reply("❌ scs user not found.");
        return;
      }

      const { data: existing } = await supabase
        .from("discord_users")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (existing) {
        message.reply("❌ This SCS account is already linked.");
        return;
      }

      const { error } = await supabase.from("discord_users").insert({
        user_id: user.id,
        discord_id: message.author.id,
        discord_username: message.author.tag,
      });

      if (error) {
        message.reply("❌ Error linking account.");
        return;
      }

      await message.member.roles.add(REGISTERED_ROLE_ID);
      await syncUserRoles(message.author.id);

      message.reply(`✅ Linked to SCS account: ${mghlUsername}`);
    } catch (error) {
      console.error("Error linking account:", error);
      message.reply("❌ Something went wrong.");
    }
  }
});

client.on("error", console.error);
client.login(BOT_TOKEN);
