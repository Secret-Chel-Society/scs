import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET() {
  try {
    // Get all teams with their logos
    const { data: teams, error: teamsError } = await supabase
      .from("teams")
      .select("id, name, logo_url")
      .eq("is_active", true)
      .order("name")

    if (teamsError) {
      console.error("Error fetching teams:", teamsError)
      return NextResponse.json({ error: "Failed to fetch teams" }, { status: 500 })
    }

    // Get live streams from twitch_users
    const { data: liveStreams, error: streamsError } = await supabase
      .from("twitch_users")
      .select(`
        *,
        discord_users!inner(
          user_id,
          users!inner(
            id,
            gamer_tag_id,
            players!inner(
              team_id,
              teams!inner(
                id,
                name,
                logo_url
              )
            )
          )
        )
      `)
      .eq("is_live", true)

    if (streamsError) {
      console.error("Error fetching live streams:", streamsError)
      return NextResponse.json({ error: "Failed to fetch live streams" }, { status: 500 })
    }

    // Check if dogelisp is live
    const { data: featuredStream, error: featuredError } = await supabase
      .from("twitch_users")
      .select("*")
      .eq("twitch_username", "dogelisp")
      .eq("is_live", true)
      .single()

    // Process teams with live stream indicators
    const teamsWithLiveStatus =
      teams?.map((team) => {
        const teamLiveStreams =
          liveStreams?.filter((stream) =>
            stream.discord_users?.users?.players?.some((player: any) => player.team_id === team.id),
          ) || []

        return {
          ...team,
          isLive: teamLiveStreams.length > 0,
          liveStreams: teamLiveStreams.map((stream) => ({
            id: stream.id,
            twitch_username: stream.twitch_username,
            stream_title: stream.stream_title,
            viewer_count: stream.viewer_count,
            started_at: stream.started_at,
            player_name: stream.discord_users?.users?.gamer_tag_id,
            stream_url: `https://twitch.tv/${stream.twitch_username}`,
          })),
        }
      }) || []

    // Get all individual live streams for the archive section
    const allLiveStreams =
      liveStreams?.map((stream) => ({
        id: stream.id,
        twitch_username: stream.twitch_username,
        stream_title: stream.stream_title,
        viewer_count: stream.viewer_count,
        started_at: stream.started_at,
        player_name: stream.discord_users?.users?.gamer_tag_id,
        team_name: stream.discord_users?.users?.players?.[0]?.teams?.name,
        team_logo: stream.discord_users?.users?.players?.[0]?.teams?.logo_url,
        stream_url: `https://twitch.tv/${stream.twitch_username}`,
      })) || []

    return NextResponse.json({
      teams: teamsWithLiveStatus,
      liveStreams: allLiveStreams,
      featuredStream: featuredError
        ? null
        : {
            id: featuredStream?.id,
            twitch_username: featuredStream?.twitch_username,
            stream_title: featuredStream?.stream_title,
            viewer_count: featuredStream?.viewer_count,
            started_at: featuredStream?.started_at,
            stream_url: `https://twitch.tv/${featuredStream?.twitch_username}`,
          },
    })
  } catch (error: any) {
    console.error("Error in livestream data API:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
