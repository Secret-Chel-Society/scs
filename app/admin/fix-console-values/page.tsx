import { FixConsoleValues } from "@/components/admin/fix-console-values"
import { Gamepad2, Wrench } from "lucide-react"

export default function FixConsoleValuesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="container mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Gamepad2 className="h-8 w-8 text-purple-400" />
            Fix Console Values
          </h1>
          <p className="text-white/70 text-lg">
            Fix console constraint violations for users that failed to be created in the database.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <FixConsoleValues />
        </div>
      </div>
    </div>
  )
}
