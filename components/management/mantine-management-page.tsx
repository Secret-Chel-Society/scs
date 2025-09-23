"use client"

import { useState, useEffect } from "react"
import { 
  Card, 
  Text, 
  Group, 
  Badge, 
  Button, 
  Tabs, 
  Table, 
  Select, 
  TextInput, 
  Avatar,
  Stack,
  Grid,
  Container,
  Title,
  ActionIcon,
  Tooltip,
  Skeleton,
  Alert
} from '@mantine/core'
import { 
  IconUsers, 
  IconCalendar, 
  IconClock, 
  IconTrophy, 
  IconDollarSign, 
  IconFilter, 
  IconHistory, 
  IconSearch,
  IconHome,
  IconGavel
} from '@tabler/icons-react'
import { useSupabase } from "@/lib/supabase/client"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { BidPlayerModal } from "@/components/management/bid-player-modal"

// This is an example of how the management page would look with Mantine
// We can gradually migrate components one by one

export function MantineManagementPage() {
  const { supabase, session } = useSupabase()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [loading, setLoading] = useState(true)
  const [teamData, setTeamData] = useState<any>(null)
  const [teamPlayers, setTeamPlayers] = useState<any[]>([])
  const [freeAgents, setFreeAgents] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState(searchParams?.get("tab") || "roster")

  // Example of Mantine components
  return (
    <Container size="xl" py="md">
      <Stack gap="md">
        {/* Header */}
        <Card padding="lg" radius="md" withBorder>
          <Group justify="space-between">
            <Group>
              {teamData?.logo_url && (
                <Avatar size="lg" src={teamData.logo_url} radius="md" />
              )}
              <div>
                <Title order={2}>{teamData?.name || "Loading..."}</Title>
                <Text c="dimmed">Team Management</Text>
              </div>
            </Group>
            <Badge size="lg" variant="light" color="blue">
              <IconTrophy size={16} style={{ marginRight: 8 }} />
              Season 1
            </Badge>
          </Group>
        </Card>

        {/* Stats Cards */}
        <Grid>
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card padding="md" radius="md" withBorder>
              <Group justify="space-between">
                <div>
                  <Text size="sm" c="dimmed">Salary Cap</Text>
                  <Text size="xl" fw={700}>$65.0M</Text>
                </div>
                <ActionIcon variant="light" color="blue" size="lg">
                  <IconDollarSign size={20} />
                </ActionIcon>
              </Group>
            </Card>
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card padding="md" radius="md" withBorder>
              <Group justify="space-between">
                <div>
                  <Text size="sm" c="dimmed">Roster Size</Text>
                  <Text size="xl" fw={700}>{teamPlayers?.length || 0}</Text>
                </div>
                <ActionIcon variant="light" color="green" size="lg">
                  <IconUsers size={20} />
                </ActionIcon>
              </Group>
            </Card>
          </Grid.Col>
        </Grid>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onChange={(value) => setActiveTab(value || "roster")}>
          <Tabs.List>
            <Tabs.Tab value="roster" leftSection={<IconUsers size={16} />}>
              Roster
            </Tabs.Tab>
            <Tabs.Tab value="free-agents" leftSection={<IconSearch size={16} />}>
              Free Agents
            </Tabs.Tab>
            <Tabs.Tab value="my-bids" leftSection={<IconGavel size={16} />}>
              My Bids
            </Tabs.Tab>
            <Tabs.Tab value="schedule" leftSection={<IconCalendar size={16} />}>
              Schedule
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="roster" pt="md">
            <Card padding="md" radius="md" withBorder>
              <Stack gap="md">
                <div>
                  <Title order={3}>Team Roster</Title>
                  <Text c="dimmed">Manage your team's players and roles</Text>
                </div>
                
                {loading ? (
                  <Stack gap="sm">
                    {Array(3).fill(0).map((_, i) => (
                      <Skeleton key={i} height={60} radius="md" />
                    ))}
                  </Stack>
                ) : teamPlayers?.length > 0 ? (
                  <Table>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Player</Table.Th>
                        <Table.Th>Position</Table.Th>
                        <Table.Th>Salary</Table.Th>
                        <Table.Th>Actions</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {teamPlayers.map((player) => (
                        <Table.Tr key={player.id}>
                          <Table.Td>
                            <Group gap="sm">
                              <Avatar size="sm" src={player.users?.avatar_url} radius="md" />
                              <div>
                                <Text fw={500}>{player.users?.gamer_tag_id}</Text>
                                <Text size="sm" c="dimmed">{player.users?.console}</Text>
                              </div>
                            </Group>
                          </Table.Td>
                          <Table.Td>
                            <Badge variant="light" color="blue">
                              {player.users?.primary_position}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Text fw={500}>${(player.salary / 1000000).toFixed(1)}M</Text>
                          </Table.Td>
                          <Table.Td>
                            <Group gap="xs">
                              <Tooltip label="View Details">
                                <ActionIcon variant="light" size="sm">
                                  <IconSearch size={14} />
                                </ActionIcon>
                              </Tooltip>
                            </Group>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                ) : (
                  <Alert color="blue" title="No Players">
                    Your team roster is empty.
                  </Alert>
                )}
              </Stack>
            </Card>
          </Tabs.Panel>

          <Tabs.Panel value="free-agents" pt="md">
            <Card padding="md" radius="md" withBorder>
              <Stack gap="md">
                <div>
                  <Title order={3}>Free Agents</Title>
                  <Text c="dimmed">Browse and bid on available players</Text>
                </div>
                
                <Group gap="md">
                  <Select
                    placeholder="Filter by position"
                    data={[
                      { value: "all", label: "All Positions" },
                      { value: "goalie", label: "Goalie" },
                      { value: "center", label: "Center" },
                      { value: "left wing", label: "Left Wing" },
                      { value: "right wing", label: "Right Wing" },
                      { value: "left defense", label: "Left Defense" },
                      { value: "right defense", label: "Right Defense" },
                    ]}
                    style={{ flex: 1 }}
                  />
                  <TextInput
                    placeholder="Search by name..."
                    leftSection={<IconSearch size={16} />}
                    style={{ flex: 2 }}
                  />
                </Group>

                {loading ? (
                  <Stack gap="sm">
                    {Array(3).fill(0).map((_, i) => (
                      <Skeleton key={i} height={80} radius="md" />
                    ))}
                  </Stack>
                ) : freeAgents?.length > 0 ? (
                  <Stack gap="sm">
                    {freeAgents.map((player) => (
                      <Card key={player.id} padding="md" radius="md" withBorder>
                        <Group justify="space-between">
                          <Group gap="md">
                            <Avatar size="md" src={player.users?.avatar_url} radius="md" />
                            <div>
                              <Text fw={500}>{player.users?.gamer_tag_id}</Text>
                              <Group gap="xs">
                                <Badge size="sm" variant="light" color="blue">
                                  {player.users?.primary_position}
                                </Badge>
                                {player.users?.secondary_position && (
                                  <Badge size="sm" variant="light" color="gray">
                                    {player.users.secondary_position}
                                  </Badge>
                                )}
                                <Text size="sm" c="dimmed">{player.users?.console}</Text>
                                <Text size="sm" fw={500}>${(player.salary / 1000000).toFixed(2)}M</Text>
                              </Group>
                            </div>
                          </Group>
                          <Button size="sm" variant="light">
                            Bid
                          </Button>
                        </Group>
                      </Card>
                    ))}
                  </Stack>
                ) : (
                  <Alert color="blue" title="No Free Agents">
                    No free agents are currently available.
                  </Alert>
                )}
              </Stack>
            </Card>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  )
}
