"use client"
import { TradesTableMigration } from "@/components/admin/trades-table-migration"
import { CreateColumnExistsMigration } from "@/components/admin/create-column-exists-migration"
import { AddSeasonNumberMigration } from "@/components/admin/add-season-number-migration"
import { EnsureSeasonNumberMigration } from "@/components/admin/ensure-season-number-migration"
import { FixSeasonIdFormatMigration } from "@/components/admin/fix-season-id-format-migration"
import { UpdateRegistrationsMigration } from "@/components/admin/update-registrations-migration"
import { AddSeasonIdMigration } from "@/components/admin/add-season-id-migration"
import { Database, Wrench } from "lucide-react"

export default function MigrationsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="container mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Database className="h-8 w-8 text-red-400" />
            Database Migrations
          </h1>
          <p className="text-white/70 text-lg">
            Run database migrations to update schema and fix data issues
          </p>
        </div>

        <div className="grid gap-6">
          <TradesTableMigration />
          <CreateColumnExistsMigration />
          <AddSeasonNumberMigration />
          <EnsureSeasonNumberMigration />
          <FixSeasonIdFormatMigration />
          <UpdateRegistrationsMigration />
          <AddSeasonIdMigration />
        </div>
      </div>
    </div>
  )
}
