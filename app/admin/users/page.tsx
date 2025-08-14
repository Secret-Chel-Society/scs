import type { Metadata } from "next"
import UsersManagementClient from "./UsersManagementClient"

export const metadata: Metadata = {
  title: "User Management | MGHL Admin",
  description: "Manage users in the MGHL system",
}

export default function UsersManagementPage() {
  return <UsersManagementClient />
}
