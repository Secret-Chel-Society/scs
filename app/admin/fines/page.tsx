"use client"

import { FineManagement } from "@/components/admin/fine-management"

export default function FinesPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Fine Management</h1>
        <p className="text-muted-foreground mt-2">
          Issue and manage team fines for rule violations across NHL and AHL leagues
        </p>
      </div>
      <FineManagement />
    </div>
  )
}
