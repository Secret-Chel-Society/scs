// Avatar synchronization utility for real-time updates across components
class AvatarSyncManager {
  private listeners: Set<(avatarUrl: string | null) => void> = new Set()

  // Subscribe to avatar updates
  subscribe(callback: (avatarUrl: string | null) => void) {
    this.listeners.add(callback)
    return () => {
      this.listeners.delete(callback)
    }
  }

  // Notify all listeners of avatar update
  notifyAvatarUpdate(avatarUrl: string | null) {
    this.listeners.forEach((callback) => {
      try {
        callback(avatarUrl)
      } catch (error) {
        console.error("Error in avatar sync callback:", error)
      }
    })
  }

  // Trigger avatar refresh across all components
  refreshAvatar(userId: string, supabase: any) {
    if (!userId || !supabase) return

    // Fetch latest avatar URL and notify listeners
    supabase
      .from("users")
      .select("avatar_url")
      .eq("id", userId)
      .single()
      .then(({ data, error }: any) => {
        if (!error && data) {
          this.notifyAvatarUpdate(data.avatar_url)
        }
      })
      .catch((error: any) => {
        console.error("Error refreshing avatar:", error)
      })
  }
}

// Global instance
export const avatarSync = new AvatarSyncManager()
