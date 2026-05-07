import { Box, Flex, SimpleGrid, Text, ThemeIcon, Title } from "@mantine/core";
import classes from './Landing.module.css';
import { IconStar } from "@tabler/icons-react";

export default function SocialProof({ }) {
  return (
    <Box mx="auto" mt="12em" mb="2em" py="6em" maw={600} style={{ position: 'relative' }}>
      <Box className={classes.bgImage}></Box>

      <Title order={2} mb="md" position="relative" fw="lighter">
        Delivered security insights for over <b>10k+</b> websites and counting
      </Title>
      <SimpleGrid cols={{ base: 1, sm: 2, md: 2 }} spacing="lg" mt="xl">
        <Flex gap="md">
          <ThemeIcon variant="light" size="md">
            <IconStar size="70%" stroke={1.5} />
          </ThemeIcon>
          <Text>Free scan - no signup required</Text>
        </Flex>
        <Flex gap="md">
          <ThemeIcon variant="light" size="md">
            <IconStar size="70%" stroke={1.5} />
          </ThemeIcon>
          <Text>Open-source on GitHub</Text>
        </Flex>
        <Flex gap="md">
          <ThemeIcon variant="light" size="md">
            <IconStar size="70%" stroke={1.5} />
          </ThemeIcon>
          <Text>Self-hostable, you own your data</Text>
        </Flex>
        <Flex gap="md">
          <ThemeIcon variant="light" size="md">
            <IconStar size="70%" stroke={1.5} />
          </ThemeIcon>
          <Text>Continuous monitoring</Text>
        </Flex>
      </SimpleGrid>
    </Box>
  );
}
