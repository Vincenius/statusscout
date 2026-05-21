import { Box, Button, Card, Flex, List, SimpleGrid, Switch, Text, ThemeIcon, Title } from "@mantine/core";
import { IconCheck } from "@tabler/icons-react";
import { useState } from "react";

export default function Pricing() {
  const [isYearly, setIsYearly] = useState(true);
  return (
    <Box py="8em">
      <Title order={2} ta="center" tt="uppercase" fw={600} ls={2} mt="sm" mb="1em">Pricing</Title>
      <Text c="dimmed" ta="center" fz="lg" mx="auto" maw="560px" mb="3em">
        Start with a free scan. Then set up continuous monitoring so you're the first to know when something breaks.
      </Text>

      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg" mx="auto" maw={{ base: 400, md: 'none' }}>
        <Card shadow="sm" radius="md" p="lg" withBorder style={{ display: 'flex', flexDirection: 'column' }}>
          <Card.Section mb="md" p="md" withBorder>
            <Title order={3} mb="sm" c="indigo">Self-hosted</Title>

            <Text fz="2em" fw={700}>Free forever</Text>
            <Text c="dimmed" fz="sm" mb="md">You only pay for your own server.</Text>

            <Text fz="sm">Deploy StatusScout to your own server. All features included, no restrictions.</Text>
          </Card.Section>

          <Card.Section mb="md" p="md" style={{ flexGrow: 1 }}>
            <List
              center
              spacing="xs"
              icon={
                <ThemeIcon color="gray" size={18} radius="sm">
                  <IconCheck size={16} />
                </ThemeIcon>
              }
            >
              <List.Item>Self-managed updates</List.Item>
              <List.Item>You manage backups & infrastructure</List.Item>
              <List.Item>Bring your own notification accounts</List.Item>
            </List>
          </Card.Section>

          <Button component="a" href="https://github.com/vincenius/statusscout" target="_blank" rel="noopener" fullWidth variant="outline">
            Get started with self-hosting
          </Button>
        </Card>

        <Card shadow="sm" radius="md" p="lg" withBorder style={{ borderColor: 'var(--mantine-primary-color-6)', display: 'flex', flexDirection: 'column' }}>
          <Card.Section mb="md" p="md" withBorder>
            <Flex justify="space-between" align="center" mb="sm">
              <Title order={3} c="indigo">Cloud</Title>
              <Switch
                checked={!isYearly}
                onChange={(event) => setIsYearly(!event.currentTarget.checked)}
                label="Monthly billing"
              />
            </Flex>

            <Text fz="2em" fw={700}>${isYearly ? 12 : 15}/month</Text>
            <Text c="dimmed" fz="sm" mb="md">Billed {isYearly ? "annually" : "monthly"}.</Text>
            <Text fz="sm">We host and run it for you. All features included, updates automatic.</Text>
          </Card.Section>

          <Card.Section mb="md" p="md" style={{ flexGrow: 1 }}>
            <List
              center
              spacing="xs"
              icon={
                <ThemeIcon color="green" size={18} radius="sm">
                  <IconCheck size={16} />
                </ThemeIcon>
              }
            >
              <List.Item>Automatic updates</List.Item>
              <List.Item>Up to 5 websites</List.Item>
              <List.Item>Up to 10 custom test flows per domain</List.Item>
              <List.Item>Notification channels included</List.Item>
            </List>
          </Card.Section>

          <Box>
            <Text c="dimmed" fz="sm" mb="xs" ta="center">
              No credit card required. Cancel anytime.
            </Text>
            <Button component="a" href={`${import.meta.env.VITE_APP_URL}/register`} target="_blank" rel="noopener" fullWidth>
              Start free 14-day trial
            </Button>
          </Box>
        </Card>

        <Card shadow="sm" radius="md" p="lg" withBorder style={{ display: 'flex', flexDirection: 'column' }}>
          <Card.Section mb="md" p="md" withBorder>
            <Title order={3} mb="sm" c="indigo">Enterprise</Title>

            <Text fz="2em" fw={700}>Contact us</Text>
            <Text c="dimmed" fz="sm" mb="md">Custom pricing.</Text>

            <Text fz="sm">Running more than 5 sites, or need a custom setup? Get in touch.</Text>
          </Card.Section>

          <Card.Section mb="md" p="md" style={{ flexGrow: 1 }}>
            <List
              center
              spacing="xs"
              icon={
                <ThemeIcon color="green" size={18} radius="sm">
                  <IconCheck size={16} />
                </ThemeIcon>
              }
            >
              <List.Item>Custom number of websites</List.Item>
              <List.Item>Custom number of test flows</List.Item>
            </List>
          </Card.Section>

          <Button component="a" href="mailto:hello@statusscout.dev" variant="outline" fullWidth>
            Get in touch
          </Button>
        </Card>
      </SimpleGrid>
    </Box>
  );
}
