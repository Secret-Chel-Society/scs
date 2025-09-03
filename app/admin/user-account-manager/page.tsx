import { AdminProtected } from "@/components/auth/admin-protected"
import { UserAccountManager } from "@/components/admin/user-account-manager"
import { PageHeader } from "@/components/ui/page-header"

export default function UserAccountManagerPage() {
  return (
    <AdminProtected>
      <div className="container mx-auto py-10">
        <PageHeader
          heading="User Account Manager"
          subheading="Search, view, and manage user accounts across all systems"
        />
        <UserAccountManager />
      </div>
    </AdminProtected>
  )
}
