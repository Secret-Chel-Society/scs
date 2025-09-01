import FixSpecificTeamManager from "@/components/admin/fix-specific-team-manager"
import { PageHeader } from "@/components/ui/page-header"

export default function FixSpecificTeamManagerPage() {
  return (
    <div className="container mx-auto py-8">
      <PageHeader
        heading="Fix Specific Team Manager"
        text="Add or update a specific user as a team manager for a specific team"
      />
      <div className="mt-8">
        <FixSpecificTeamManager />
      </div>
    </div>
  )
}
