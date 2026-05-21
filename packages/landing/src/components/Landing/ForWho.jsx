import { Text, Title, Flex, Box, Stack } from "@mantine/core";
import classes from './Landing.module.css';

const PERSONAS = [
  {
    role: "Agencies",
    description: "Keep an eye on every client site from one place. Catch downtime, expiring SSL certs, and security regressions before your clients do.",
  },
  {
    role: "Freelance developers",
    description: "Hand off projects with confidence. StatusScout keeps watching after you're done, so a misconfigured header or expired cert doesn't come back to you.",
  },
  {
    role: "SaaS founders",
    description: "Ship fast without skipping security. Get uptime alerts, DNS monitoring, and a full security scan — without needing a dedicated DevOps team.",
  },
];

export default function ForWho() {
  return (
    <Box py="8em" style={{ position: 'relative' }}>
      <Box className={classes.bgColor} />

      <Title order={2} ta="center" tt="uppercase" fw={600} mb="xl" ls={2}>
        Who it&apos;s for
      </Title>

      <Stack gap="0">
        {PERSONAS.map((p, i) => (
          <Flex
            key={p.role}
            align={{ base: 'flex-start', sm: 'center' }}
            direction={{ base: 'column', sm: 'row' }}
            gap={{ base: 'xs', sm: 'xl' }}
            py="md"
            style={{
              borderTop: '1px solid var(--mantine-color-default-border)',
              ...(i === PERSONAS.length - 1 ? { borderBottom: '1px solid var(--mantine-color-default-border)' } : {}),
            }}
          >
            <Title
              order={3}
              className={classes.highlight}
              style={{ minWidth: 260, fontSize: '1.25rem', fontWeight: 400 }}
            >
              {p.role}
            </Title>
            <Text c="dimmed" size="sm" style={{ maxWidth: 520 }}>
              {p.description}
            </Text>
          </Flex>
        ))}
      </Stack>
    </Box>
  );
}
