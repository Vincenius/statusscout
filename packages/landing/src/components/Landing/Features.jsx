import { Card, Stack, Text, Title, SimpleGrid, ThemeIcon, useMantineTheme, Flex } from "@mantine/core";
import {
  IconShieldLock,
  IconFileAlert,
  IconLock,
  IconApi,
  IconCookie,
  IconBug,
  IconSparkles,
} from "@tabler/icons-react";
import classes from './Landing.module.css';

export default function Features() {
  const theme = useMantineTheme();

  const features = [
    {
      icon: IconFileAlert,
      title: "Your password file might be readable by anyone",
      description:
        "API keys, database passwords, secret tokens. If these files are accidentally served by your app, anyone on the internet can grab them.",
    },
    {
      icon: IconApi,
      title: "Your API docs might be open to everyone",
      description:
        "Tools like FastAPI and Swagger publish your full API layout by default. Anyone can browse your endpoints and figure out how to break in.",
    },
    {
      icon: IconShieldLock,
      title: "Invisible protections your app is probably missing",
      description:
        "There are browser-level security settings AI tools almost never turn on. We check which ones are missing and tell you exactly what to add.",
    },
    {
      icon: IconCookie,
      title: "Your login sessions could be hijacked",
      description:
        "Login cookies need specific security flags. Without them, attackers can steal user sessions through other holes in your site.",
    },
    {
      icon: IconBug,
      title: "Your error pages might be leaking your code",
      description:
        "When something breaks, the error page should not show file paths or stack traces. We check if your app is accidentally exposing that.",
    },
    {
      icon: IconSparkles,
      title: "Every issue comes with an AI fix prompt",
      description:
        "Each problem we find includes a ready-made prompt for Cursor, Claude, or ChatGPT. Copy it, paste it, and get step-by-step fix instructions — no security expertise needed.",
    },
  ];

  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg" mx="auto" mt="4em" mb="6em">
      {features.map((feature, index) => (
        <Card key={index} shadow="md" radius="md" p="lg" withBorder>
          <Flex gap="md">
            <ThemeIcon variant="light" size={44}>
              <feature.icon size="70%" stroke={1.5} />
            </ThemeIcon>
            <Title order={2} size="h4" className={classes.featureTitle}>{feature.title}</Title>
          </Flex>
          <Text size="sm" mt="md">
            {feature.description}
          </Text>
        </Card>
      ))}
    </SimpleGrid>
  );
}
