import { InjuryReservesMigration } from "@/components/admin/injury-reserves-migration"

export default function InjuryReservesMigrationPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Injury Reserves Migration</h1>
        <InjuryReservesMigration />
      </div>
    </div>
  )
}
