import type { Metadata } from "next"
import UsersManagementClient from "./UsersManagementClient"

export const metadata: Metadata = {
  title: "User Management | SCS Admin",
  description: "Manage users in the SCS system",
}

export default function UsersManagementPage() {
  return <UsersManagementClient />
}