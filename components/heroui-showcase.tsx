"use client"

import React from "react"
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Tabs,
  Tab,
  Badge,
  Input,
  Select,
  SelectItem,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Avatar,
  Progress,
  Spinner,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/react"

export function HeroUIShowcase() {
  const { isOpen, onOpen, onOpenChange } = useDisclosure()

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">HeroUI Components Showcase</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Beautiful, modern React UI components for your Secret Chel Society
        </p>
      </div>

      {/* Buttons Section */}
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-semibold">Buttons</h2>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Button color="primary">Primary</Button>
            <Button color="secondary">Secondary</Button>
            <Button color="success">Success</Button>
            <Button color="warning">Warning</Button>
            <Button color="danger">Danger</Button>
            <Button variant="bordered">Bordered</Button>
            <Button variant="light">Light</Button>
            <Button variant="flat">Flat</Button>
            <Button variant="faded">Faded</Button>
            <Button variant="shadow">Shadow</Button>
            <Button variant="ghost">Ghost</Button>
          </div>
        </CardBody>
      </Card>

      {/* Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Team Stats</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Wins</span>
                <Badge color="success">24</Badge>
              </div>
              <div className="flex justify-between">
                <span>Losses</span>
                <Badge color="danger">8</Badge>
              </div>
              <div className="flex justify-between">
                <span>Points</span>
                <Badge color="primary">48</Badge>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Player Performance</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Goals</span>
                  <span className="text-sm">85%</span>
                </div>
                <Progress value={85} color="success" />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Assists</span>
                  <span className="text-sm">72%</span>
                </div>
                <Progress value={72} color="primary" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Team Roster</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Avatar src="https://i.pravatar.cc/150?u=1" size="sm" />
                <div>
                  <p className="text-sm font-medium">Connor McDavid</p>
                  <Chip size="sm" color="primary">Captain</Chip>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Avatar src="https://i.pravatar.cc/150?u=2" size="sm" />
                <div>
                  <p className="text-sm font-medium">Leon Draisaitl</p>
                  <Chip size="sm" color="secondary">Alternate</Chip>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Form Elements */}
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-semibold">Form Elements</h2>
        </CardHeader>
        <CardBody className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Input
                label="Player Name"
                placeholder="Enter player name"
                variant="bordered"
              />
              <Input
                label="Salary"
                placeholder="Enter salary"
                type="number"
                variant="bordered"
                startContent="$"
              />
              <Select
                label="Position"
                placeholder="Select position"
                variant="bordered"
              >
                <SelectItem key="center" value="center">Center</SelectItem>
                <SelectItem key="left-wing" value="left-wing">Left Wing</SelectItem>
                <SelectItem key="right-wing" value="right-wing">Right Wing</SelectItem>
                <SelectItem key="defense" value="defense">Defense</SelectItem>
                <SelectItem key="goalie" value="goalie">Goalie</SelectItem>
              </Select>
            </div>
            <div className="space-y-4">
              <Button color="primary" onPress={onOpen}>
                Open Modal
              </Button>
              <div className="flex items-center gap-2">
                <Spinner size="sm" />
                <span className="text-sm">Loading team data...</span>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Tabs Section */}
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-semibold">Tabs</h2>
        </CardHeader>
        <CardBody>
          <Tabs aria-label="Team Management">
            <Tab key="roster" title="Roster">
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-4">Team Roster</h3>
                <Table aria-label="Team roster table">
                  <TableHeader>
                    <TableColumn>NAME</TableColumn>
                    <TableColumn>POSITION</TableColumn>
                    <TableColumn>STATUS</TableColumn>
                    <TableColumn>SALARY</TableColumn>
                  </TableHeader>
                  <TableBody>
                    <TableRow key="1">
                      <TableCell>Connor McDavid</TableCell>
                      <TableCell>Center</TableCell>
                      <TableCell>
                        <Chip color="success" size="sm">Active</Chip>
                      </TableCell>
                      <TableCell>$12,500,000</TableCell>
                    </TableRow>
                    <TableRow key="2">
                      <TableCell>Leon Draisaitl</TableCell>
                      <TableCell>Center</TableCell>
                      <TableCell>
                        <Chip color="success" size="sm">Active</Chip>
                      </TableCell>
                      <TableCell>$8,500,000</TableCell>
                    </TableRow>
                    <TableRow key="3">
                      <TableCell>Evan Bouchard</TableCell>
                      <TableCell>Defense</TableCell>
                      <TableCell>
                        <Chip color="warning" size="sm">Injured</Chip>
                      </TableCell>
                      <TableCell>$3,900,000</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </Tab>
            <Tab key="stats" title="Statistics">
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-4">Team Statistics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">24</p>
                    <p className="text-sm text-gray-600">Wins</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-danger">8</p>
                    <p className="text-sm text-gray-600">Losses</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-success">156</p>
                    <p className="text-sm text-gray-600">Goals For</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-warning">98</p>
                    <p className="text-sm text-gray-600">Goals Against</p>
                  </div>
                </div>
              </div>
            </Tab>
            <Tab key="schedule" title="Schedule">
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-4">Upcoming Games</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">vs Toronto Maple Leafs</p>
                      <p className="text-sm text-gray-600">Tomorrow, 7:00 PM</p>
                    </div>
                    <Badge color="primary">Home</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">@ Calgary Flames</p>
                      <p className="text-sm text-gray-600">Friday, 8:00 PM</p>
                    </div>
                    <Badge color="secondary">Away</Badge>
                  </div>
                </div>
              </div>
            </Tab>
          </Tabs>
        </CardBody>
      </Card>

      {/* Modal */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <h3 className="text-lg font-semibold">Team Management</h3>
                <p className="text-sm text-gray-600">
                  Manage your team roster and settings
                </p>
              </ModalHeader>
              <ModalBody>
                <p>
                  This is a HeroUI modal component. You can use it for forms,
                  confirmations, or any other content that needs to be displayed
                  in an overlay.
                </p>
                <div className="mt-4">
                  <Input
                    label="Team Name"
                    placeholder="Enter team name"
                    variant="bordered"
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button color="primary" onPress={onClose}>
                  Save Changes
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  )
}
