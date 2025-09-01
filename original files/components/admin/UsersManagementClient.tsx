"use client"

import { useState } from "react"
import { Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material"
import { BanUserDialog } from "./ban-user-dialog"
import { BannedUsersPanel } from "./banned-users-panel"
import { Button } from "./button" // Assuming Button is a custom component

const UsersManagementClient = () => {
  const [banDialogOpen, setBanDialogOpen] = useState(false)
  const [selectedBanUser, setSelectedBanUser] = useState<any>(null)
  const [refreshUsersList, setRefreshUsersList] = useState(false)

  const handleBanSuccess = () => {
    // This function will be called after a successful ban
    setRefreshUsersList((prev) => !prev) // Toggle the state to trigger a re-fetch
  }

  const openBanDialog = (user: any) => {
    setSelectedBanUser(user)
    setBanDialogOpen(true)
  }

  const closeBanDialog = () => {
    setSelectedBanUser(null)
    setBanDialogOpen(false)
  }

  // Simulated users data
  const users = [
    { id: 1, name: "John Doe", active: true },
    { id: 2, name: "Jane Smith", active: false },
  ]

  return (
    <Card>
      <CardContent>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Active</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.id}</TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.active ? "Yes" : "No"}</TableCell>
                  <TableCell>
                    <Button variant="contained" size="sm" onClick={() => console.log("Toggle Activation")}>
                      Toggle Activation
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openBanDialog(user)}>
                      Ban User
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <BannedUsersPanel />
      </CardContent>
      <BanUserDialog
        open={banDialogOpen}
        onOpenChange={closeBanDialog}
        userId={selectedBanUser?.id}
        onBanSuccess={handleBanSuccess}
      />
    </Card>
  )
}

export default UsersManagementClient
