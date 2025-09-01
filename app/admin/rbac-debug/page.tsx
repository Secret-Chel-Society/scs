import { PageHeader } from "@/components/ui/page-header"
import { RbacDebugger } from "@/components/admin/rbac-debugger"

export default function RbacDebugPage() {
  return (
    <div className="container py-6">
      <PageHeader
        heading="RBAC Permission Debugger"
        text="Test and debug role-based access control permissions for match management"
      />
      <RbacDebugger />
    </div>
  )
}
