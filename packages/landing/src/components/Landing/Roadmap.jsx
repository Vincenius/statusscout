import { Table, Text, Title, Stack, Box, Flex, List, Card } from "@mantine/core";
import { IconCheck, IconCode, IconBellRinging, IconShieldLock, IconDeviceLaptop, IconSparkles } from "@tabler/icons-react";
import classes from "./Landing.module.css";

export default function Roadmap({
  heading = "Product Roadmap",
  subheading = "What’s shipped and what’s next for security-first monitoring.",
  items = defaultItems,
}) {
  return (
    <Box
      mx="auto"
      maw={900}
      radius="xl"
      p="md"
      py="8em"
      style={{ position: "relative" }}
    >
      <Box className={classes.circuitPattern}></Box>
      <Stack align="center" gap="xs" mb="xl">
        <Title order={2} size="2em" ta="center">{heading}</Title>
        <Text size="lg" ta="center">
          {subheading}
        </Text>
      </Stack>

      <Table
        withTableBorder
        withColumnBorders
        display={{ base: "none", xs: "table" }}
        bg="var(--mantine-color-body)"
      >
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Status</Table.Th>
            <Table.Th>Feature</Table.Th>
            <Table.Th>Description</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {items.map((item, idx) => (
            <Table.Tr key={idx}>
              <Table.Td>
                <Flex gap="xs">
                  {item.icon}
                  <Text size="sm" c={item.completed ? "green" : ""}>
                    {item.completed ? "Done" : "Planned"}
                  </Text>
                </Flex>
              </Table.Td>
              <Table.Td>
                <Text fw={500}>{item.title}</Text>
              </Table.Td>
              <Table.Td>
                <Text size="sm">
                  {item.description}
                </Text>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      <Card display={{ base: "block", xs: "none" }} mt="xl" withBorder radius="md" p="md" bg="var(--mantine-color-body)">
        <List spacing="md">
          {items.map((item, idx) => (
            <List.Item key={idx} icon={item.icon} color={item.completed ? "green" : ""}>
              <Text fw={500}>{item.title}</Text>
              <Text size="sm">{item.description}</Text>
            </List.Item>
          ))}
        </List>
      </Card>

    </Box>
  );
}

// Default roadmap items
const defaultItems = [
  {
    title: "Security & Health Scanner",
    description: "9 checks in one scan: SSL, security headers, exposed files, cookie security, exposed API docs, DNS records, mixed content, and page security issues. Free, no signup required.",
    icon: <IconCheck size={18} color="green" />,
    completed: true,
  },
  {
    title: "Continuous Monitoring & Alerts",
    description: "Automated checks every 5 minutes, 6 hours, and daily. Get alerted the moment something breaks via email, SMS, or ntfy.",
    icon: <IconBellRinging size={18} color="green" />,
    completed: true,
  },
  {
    title: "Custom Test Flows",
    description: "Define multi-step Playwright flows to simulate signups, checkouts, and critical user journeys and get alerted when they break.",
    icon: <IconCode size={18} color="green" />,
    completed: true,
  },
  {
    title: "Dependency Vulnerability Scanning",
    description: "Find packages with known CVEs in your app's dependencies.",
    icon: <IconShieldLock size={18} color="orange" />,
    completed: false,
  },
  {
    title: "API Access",
    description: "Trigger scans and pull results programmatically. Integrate StatusScout into your CI/CD pipeline.",
    icon: <IconDeviceLaptop size={18} color="orange" />,
    completed: false,
  },
];
