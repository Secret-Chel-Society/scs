"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    console.error("Forum post error:", error)
  }, [error])

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="border-destructive">
        <CardContent className="p-8 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
          <h3 className="text-lg font-semibold mb-2">Something went wrong!</h3>
          <p className="text-muted-foreground mb-4">
            There was an error loading this forum post. This might be because the forum replies migration hasn't been
            run yet.
          </p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={() => router.push("/forum")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Forum
            </Button>
            <Button onClick={reset}>Try Again</Button>
            <Button variant="outline" onClick={() => router.push("/admin/forum-replies-migration")}>
              Run Migration
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
