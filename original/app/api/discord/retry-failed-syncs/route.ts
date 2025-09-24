import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST() {
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Get unresolved failures that haven't been retried too many times
    const { data: failures, error: fetchError } = await supabase
      .from("discord_sync_failures")
      .select("*")
      .is("resolved_at", null)
      .lt("retry_count", 3)
      .order("created_at", { ascending: true })
      .limit(10)

    if (fetchError) {
      console.error("Error fetching failed syncs:", fetchError)
      return NextResponse.json({ error: "Failed to fetch sync failures" }, { status: 500 })
    }

    if (!failures || failures.length === 0) {
      return NextResponse.json({ message: "No failed syncs to retry", retried: 0 })
    }

    const botWebhookUrl = process.env.DISCORD_BOT_WEBHOOK_URL
    if (!botWebhookUrl) {
      return NextResponse.json({ error: "Discord bot webhook URL not configured" }, { status: 500 })
    }

    let successCount = 0
    let failureCount = 0

    for (const failure of failures) {
      try {
        const webhookResponse = await fetch(botWebhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.DISCORD_BOT_TOKEN}`,
          },
          body: JSON.stringify(failure.payload),
        })

        if (webhookResponse.ok) {
          // Mark as resolved
          await supabase
            .from("discord_sync_failures")
            .update({
              resolved_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", failure.id)

          successCount++
        } else {
          throw new Error(`Webhook failed: ${webhookResponse.status}`)
        }
      } catch (retryError: any) {
        // Update retry count and last retry time
        await supabase
          .from("discord_sync_failures")
          .update({
            retry_count: failure.retry_count + 1,
            last_retry_at: new Date().toISOString(),
            error_message: `${failure.error_message} | Retry ${failure.retry_count + 1}: ${retryError.message}`,
            updated_at: new Date().toISOString(),
          })
          .eq("id", failure.id)

        failureCount++
      }
    }

    return NextResponse.json({
      message: `Retry completed: ${successCount} succeeded, ${failureCount} failed`,
      retried: failures.length,
      succeeded: successCount,
      failed: failureCount,
    })
  } catch (error: any) {
    console.error("Retry failed syncs error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
