import { FixTieGames } from "@/components/admin/fix-tie-games"

export default function FixTieGamesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Fix Tie Games</h1>
          <p className="text-muted-foreground">
            Fix standings calculation for tie games (1-1, 2-2, etc.) to count as losses for both teams
          </p>
        </div>

        <FixTieGames />
      </div>
    </div>
  )
}
