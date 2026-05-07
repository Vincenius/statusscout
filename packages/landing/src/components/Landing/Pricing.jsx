import { Box, Button, Card, Flex, List, SimpleGrid, Switch, Text, ThemeIcon, Title } from "@mantine/core";
import { IconCheck } from "@tabler/icons-react";
import { useState } from "react";

export default function Pricing() {
  const [isYearly, setIsYearly] = useState(true);
  return (
    <Box mt="12em" mb="12em">
      <Title size="2em" order={2} ta="center" mt="sm" mb="1em">Pricing</Title>
      <Text c="dimmed" ta="center" fz="lg" mx="auto" maw="560px" mb="3em">
        Built for indie developers and vibe coders. Start with a free scan, then set up continuous monitoring so you're never caught off guard again.
      </Text>

      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg" mx="auto" maw={{ base: 400, md: 'none' }}>
        <Card shadow="sm" radius="md" p="lg" withBorder>
          <Card.Section mb="md" p="md" withBorder>
            <Title order={3} mb="sm" c="indigo">Self-hosted</Title>

            <Text fz="2em" fw={700}>Free forever</Text>
            <Text c="dimmed" fz="sm" mb="md">You only pay for your own server.</Text>

            <Text fz="sm">Deploy StatusScout to your own infrastructure. Full feature set, no restrictions, self-managed updates.</Text>
          </Card.Section>

          <Card.Section mb="md" p="md">
            <List
              center
              spacing="xs"
              icon={
                <ThemeIcon color="green" size={18} radius="sm">
                  <IconCheck size={16} />
                </ThemeIcon>
              }
            >
              <List.Item>All core features</List.Item>
              <List.Item>Self-managed updates</List.Item>
              <List.Item>Includes all upcoming features</List.Item>
            </List>
          </Card.Section>

          <Button component="a" href="https://github.com/vincenius/statusscout" target="_blank" rel="noopener" fullWidth variant="outline">
            Get Started with Self-hosting
          </Button>
        </Card>

        <Card shadow="sm" radius="md" p="lg" withBorder style={{ borderColor: 'var(--mantine-primary-color-6)' }}>
          {/* Cloud (head -> switch between monthly and yearly billing) */}
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
            <Text fz="sm">Fully managed service with all features and automatic updates.</Text>
          </Card.Section>

          <Card.Section mb="md" p="md">
            <List
              center
              spacing="xs"
              icon={
                <ThemeIcon color="green" size={18} radius="sm">
                  <IconCheck size={16} />
                </ThemeIcon>
              }
            >
              <List.Item>All core features</List.Item>
              <List.Item>Up to 5 Websites</List.Item>
              <List.Item>Up to 10 custom test flows per domain</List.Item>
            </List>
          </Card.Section>

          <Button component="a" href={`${import.meta.env.VITE_APP_URL}/register`} target="_blank" rel="noopener" fullWidth>
            Start Free 7-Day Trial
          </Button>
          <Text c="dimmed" fz="sm" mt="xs">
            * No credit card required. Cancel anytime.
          </Text>
        </Card>

        <Card shadow="sm" radius="md" p="lg" withBorder>
          <Card.Section mb="md" p="md" withBorder>
            <Title order={3} mb="sm" c="indigo">Enterprise</Title>

            <Text fz="2em" fw={700}>Contact us</Text>
            <Text c="dimmed" fz="sm" mb="md">Contact us for details.</Text>

            <Text fz="sm">Need a bigger package? We offer custom solutions to fit your needs.</Text>
          </Card.Section>

          <Card.Section mb="md" p="md">
            <List
              center
              spacing="xs"
              icon={
                <ThemeIcon color="green" size={18} radius="sm">
                  <IconCheck size={16} />
                </ThemeIcon>
              }
            >
              <List.Item>All core features</List.Item>
              <List.Item>Custom amount of Websites</List.Item>
              <List.Item>Custom amount of test flows</List.Item>
            </List>
          </Card.Section>

          <Button component="a" href="mailto:hello@statusscout.dev" variant="outline" fullWidth>
            Contact Us
          </Button>
        </Card>
      </SimpleGrid>
    </Box>
  );
}
