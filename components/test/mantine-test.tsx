"use client"

import { 
  Card, 
  Text, 
  Button, 
  Group, 
  Badge, 
  Stack,
  Container,
  Title
} from '@mantine/core'
import { IconUsers, IconTrophy, IconDollarSign } from '@tabler/icons-react'

export function MantineTest() {
  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        <Title order={1} ta="center">
          Mantine UI Integration Test
        </Title>
        
        <Text ta="center" c="dimmed">
          Testing Mantine components with your hockey theme
        </Text>

        <Card padding="lg" radius="md" withBorder>
          <Stack gap="md">
            <Title order={3}>Hockey Team Stats</Title>
            
            <Group justify="space-between">
              <Group>
                <IconUsers size={24} />
                <div>
                  <Text size="sm" c="dimmed">Roster Size</Text>
                  <Text size="xl" fw={700}>23</Text>
                </div>
              </Group>
              
              <Group>
                <IconTrophy size={24} />
                <div>
                  <Text size="sm" c="dimmed">Wins</Text>
                  <Text size="xl" fw={700}>15</Text>
                </div>
              </Group>
              
              <Group>
                <IconDollarSign size={24} />
                <div>
                  <Text size="sm" c="dimmed">Salary Cap</Text>
                  <Text size="xl" fw={700}>$65M</Text>
                </div>
              </Group>
            </Group>

            <Group gap="sm">
              <Badge color="blue" variant="light">Active</Badge>
              <Badge color="green" variant="light">Healthy</Badge>
              <Badge color="red" variant="light">Injured</Badge>
            </Group>

            <Group justify="center">
              <Button variant="filled" color="blue">
                View Roster
              </Button>
              <Button variant="outline" color="blue">
                Edit Team
              </Button>
            </Group>
          </Stack>
        </Card>

        <Card padding="lg" radius="md" withBorder>
          <Stack gap="md">
            <Title order={3}>Theme Integration Test</Title>
            <Text>
              This card should use your existing CSS variables for colors and styling.
              The background should match your card theme, and the text should use your foreground colors.
            </Text>
            <Text size="sm" c="dimmed">
              If you see this text in the correct colors, the integration is working!
            </Text>
          </Stack>
        </Card>
      </Stack>
    </Container>
  )
}
