import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    // Create Supabase client
    const supabase = createRouteHandlerClient({ cookies })

    console.log("Populating test IP data...")

    // Get some users to populate with test data
    const { data: users, error: usersError } = await supabase.from("users").select("id").limit(10)

    if (usersError) {
      console.error("Error fetching users:", usersError)
      return NextResponse.json(
        {
          error: usersError.message,
          details: "Failed to fetch users",
        },
        { status: 500 },
      )
    }

    if (!users || users.length === 0) {
      return NextResponse.json(
        {
          error: "No users found",
          details: "Cannot populate test data without users",
        },
        { status: 404 },
      )
    }

    console.log(`Found ${users.length} users to populate with test IP data`)

    // Sample IP addresses for testing
    const sampleIPs = [
      "192.168.1.1",
      "10.0.0.1",
      "172.16.0.1",
      "127.0.0.1",
      "8.8.8.8",
      "1.1.1.1",
      "192.168.0.1",
      "10.0.0.2",
    ]

    // Sample user agents
    const sampleUserAgents = [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15",
      "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1",
      "Mozilla/5.0 (iPad; CPU OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1",
    ]

    // Sample actions
    const actions = ["login", "register", "update_profile", "change_password"]

    // Populate test data
    const results = []

    for (const user of users) {
      // Assign a random IP for registration
      const registrationIp = sampleIPs[Math.floor(Math.random() * sampleIPs.length)]

      // Update user with registration IP
      const { error: updateError } = await supabase
        .from("users")
        .update({ registration_ip: registrationIp })
        .eq("id", user.id)

      if (updateError) {
        console.error(`Error updating user ${user.id} with registration IP:`, updateError)
        continue
      }

      // Add registration log
      const { data: regLog, error: regLogError } = await supabase
        .from("ip_logs")
        .insert({
          user_id: user.id,
          ip_address: registrationIp,
          action: "register",
          user_agent: sampleUserAgents[Math.floor(Math.random() * sampleUserAgents.length)],
          created_at: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)).toISOString(), // Random date in the last 30 days
        })
        .select()

      if (regLogError) {
        console.error(`Error adding registration log for user ${user.id}:`, regLogError)
      } else {
        results.push(regLog)
      }

      // Add 1-3 login logs with potentially different IPs
      const numLogins = 1 + Math.floor(Math.random() * 3)

      for (let i = 0; i < numLogins; i++) {
        const loginIp =
          Math.random() > 0.7
            ? sampleIPs[Math.floor(Math.random() * sampleIPs.length)] // Different IP
            : registrationIp // Same IP as registration

        const loginTime = new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)) // Random date in the last 7 days

        // Update user with last login IP and time
        const { error: loginUpdateError } = await supabase
          .from("users")
          .update({
            last_login_ip: loginIp,
            last_login_at: loginTime.toISOString(),
          })
          .eq("id", user.id)

        if (loginUpdateError) {
          console.error(`Error updating user ${user.id} with login data:`, loginUpdateError)
          continue
        }

        // Add login log
        const { data: loginLog, error: loginLogError } = await supabase
          .from("ip_logs")
          .insert({
            user_id: user.id,
            ip_address: loginIp,
            action: "login",
            user_agent: sampleUserAgents[Math.floor(Math.random() * sampleUserAgents.length)],
            created_at: loginTime.toISOString(),
          })
          .select()

        if (loginLogError) {
          console.error(`Error adding login log for user ${user.id}:`, loginLogError)
        } else {
          results.push(loginLog)
        }
      }

      // Add 0-2 other action logs
      if (Math.random() > 0.5) {
        const numOtherActions = 1 + Math.floor(Math.random() * 2)

        for (let i = 0; i < numOtherActions; i++) {
          const actionIp =
            Math.random() > 0.8
              ? sampleIPs[Math.floor(Math.random() * sampleIPs.length)] // Different IP
              : registrationIp // Same IP as registration

          const action = actions[Math.floor(Math.random() * actions.length)]
          const actionTime = new Date(Date.now() - Math.floor(Math.random() * 14 * 24 * 60 * 60 * 1000)) // Random date in the last 14 days

          // Add action log
          const { data: actionLog, error: actionLogError } = await supabase
            .from("ip_logs")
            .insert({
              user_id: user.id,
              ip_address: actionIp,
              action: action,
              user_agent: sampleUserAgents[Math.floor(Math.random() * sampleUserAgents.length)],
              created_at: actionTime.toISOString(),
            })
            .select()

          if (actionLogError) {
            console.error(`Error adding ${action} log for user ${user.id}:`, actionLogError)
          } else {
            results.push(actionLog)
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully populated test IP data for ${users.length} users`,
      details: `Created ${results.length} log entries`,
    })
  } catch (error: any) {
    console.error("Error populating test IP data:", error)
    return NextResponse.json(
      {
        error: error.message,
        details: "Error occurred while populating test IP data",
      },
      { status: 500 },
    )
  }
}
