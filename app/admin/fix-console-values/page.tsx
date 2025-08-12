import { FixConsoleValues } from "@/components/admin/fix-console-values"

export default function FixConsoleValuesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Fix Console Values</h1>
          <p className="text-muted-foreground">
            Fix console constraint violations for users that failed to be created in the database.
          </p>
        </div>

        <FixConsoleValues />
      </div>
    </div>
  )
}
