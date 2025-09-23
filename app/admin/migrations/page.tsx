"use client"
import { CreateColumnExistsMigration } from "@/components/admin/create-column-exists-migration"
import { AddSeasonNumberMigration } from "@/components/admin/add-season-number-migration"
import { EnsureSeasonNumberMigration } from "@/components/admin/ensure-season-number-migration"
import { FixSeasonIdFormatMigration } from "@/components/admin/fix-season-id-format-migration"
import { UpdateRegistrationsMigration } from "@/components/admin/update-registrations-migration"
import { AddSeasonIdMigration } from "@/components/admin/add-season-id-migration"

export default function MigrationsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Database Migrations</h1>
        <p className="text-muted-foreground">Run database migrations to update schema and fix data issues</p>
      </div>

      <div className="grid gap-6">
        <CreateColumnExistsMigration />
        <AddSeasonNumberMigration />
        <EnsureSeasonNumberMigration />
        <FixSeasonIdFormatMigration />
        <UpdateRegistrationsMigration />
        <AddSeasonIdMigration />
      </div>
    </div>
  )
}
