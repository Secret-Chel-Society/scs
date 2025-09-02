import { Progress } from "@/components/ui/progress"

interface RosterProgressProps {
  current: number
  max: number
  projected?: number
}

export function RosterProgress({ current, max, projected }: RosterProgressProps) {
  const currentPercentage = Math.min(100, (current / max) * 100)
  const projectedPercentage = projected ? Math.min(100, (projected / max) * 100) : currentPercentage
  const isOverLimit = projected ? projected > max : current > max

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-white">
          {current} / {max} players
        </span>
        {projected && projected !== current && (
          <span className={`${isOverLimit ? "text-red-400" : "text-green-400"}`}>Projected: {projected}</span>
        )}
      </div>
      <div className="relative">
        <Progress value={currentPercentage} className="h-2 bg-slate-700" indicatorClassName="bg-green-500" />
        {projected && projected !== current && (
          <div
            className={`absolute top-0 h-2 border-r-2 ${isOverLimit ? "border-red-500" : "border-green-300"}`}
            style={{ left: `${projectedPercentage}%` }}
          />
        )}
      </div>
    </div>
  )
}
