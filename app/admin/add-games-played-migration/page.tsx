import { AddGamesPlayedMigration } from "@/components/admin/add-games-played-migration"

export default function AddGamesPlayedMigrationPage() {
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-8">EA Player Stats Migrations</h1>
      <AddGamesPlayedMigration />
    </div>
  )
}
