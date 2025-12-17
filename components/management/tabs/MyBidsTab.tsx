"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock } from "lucide-react"

type Props = {
  myBids: any[]
  teamName?: string
  activeBidsCount: number
  outbidCount: number
  formatTimeRemaining: (expiresAt: string) => string
  getPositionAbbreviation: (pos: string) => string
  getPositionColor: (pos: string) => string
}

export default function MyBidsTab({
  myBids,
  teamName,
  activeBidsCount,
  outbidCount,
  formatTimeRemaining,
  getPositionAbbreviation,
  getPositionColor,
}: Props) {
  console.log("[v0] MyBidsTab received myBids:", myBids)

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Bids</CardTitle>
        <CardDescription>
          Bids placed by {teamName}. Active: {activeBidsCount} | Outbid: {outbidCount} | Total: {myBids.length}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {myBids.length > 0 ? (
          <div className="space-y-4">
            {myBids.map((bid) => {
              const isExpired = bid.isExpired
              const isWinning = bid.isHighestBidder && !isExpired
              const isOutbid = !bid.isHighestBidder && !isExpired

              let cardClass = "border rounded-lg p-4"
              let statusBadge = { variant: "secondary" as const, text: "EXPIRED" }

              if (isWinning) {
                cardClass = "border-2 border-green-500 bg-green-50 dark:bg-green-900/20 rounded-lg p-4"
                statusBadge = { variant: "default" as const, text: "WINNING" }
              } else if (isOutbid) {
                cardClass = "border-2 border-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg p-4"
                statusBadge = { variant: "destructive" as const, text: "OUTBID" }
              } else if (isExpired && bid.isHighestBidder) {
                cardClass = "border-2 border-green-500 bg-green-50 dark:bg-green-900/20 rounded-lg p-4 opacity-75"
                statusBadge = { variant: "default" as const, text: "WON" }
              } else if (isExpired) {
                cardClass = "border-2 border-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg p-4 opacity-75"
                statusBadge = { variant: "destructive" as const, text: "LOST" }
              }

              const primaryPos = bid.registration?.primary_position
              const secondaryPos = bid.registration?.secondary_position

              return (
                <div key={bid.id} className={cardClass}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{bid.players?.users?.gamer_tag_id || "Unknown Player"}</h3>
                      <div className="flex items-center gap-1 mt-1">
                        {primaryPos ? (
                          <>
                            <span className={getPositionColor(primaryPos)}>{getPositionAbbreviation(primaryPos)}</span>
                            {secondaryPos && (
                              <>
                                {" / "}
                                <span className={getPositionColor(secondaryPos)}>
                                  {getPositionAbbreviation(secondaryPos)}
                                </span>
                              </>
                            )}
                          </>
                        ) : (
                          <span className="text-muted-foreground text-sm">Position unknown</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Your bid: ${bid.bid_amount?.toLocaleString()}
                      </p>
                      {!bid.isHighestBidder && bid.highestBid && (
                        <p className="text-sm text-red-600 dark:text-red-400 font-bold">
                          Highest bid: ${bid.highestBid.bid_amount?.toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={statusBadge.variant}
                        className={
                          isWinning ? "bg-green-500 hover:bg-green-600" : isOutbid ? "bg-red-500 hover:bg-red-600" : ""
                        }
                      >
                        {statusBadge.text}
                      </Badge>
                      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1 justify-end">
                        <Clock className="h-3 w-3" />
                        {formatTimeRemaining(bid.bid_expires_at)}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">No bids placed yet.</div>
        )}
      </CardContent>
    </Card>
  )
}
