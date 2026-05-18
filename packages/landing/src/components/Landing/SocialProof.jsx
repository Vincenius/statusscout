import { Box, Flex, SimpleGrid, Text, ThemeIcon, Title } from "@mantine/core";
import classes from './Landing.module.css';
import { IconStar } from "@tabler/icons-react";

export default function SocialProof({ title, bullets }) {
  return (
    <Box mx="auto" mt="12em" mb="2em" py="6em" maw={600} style={{ position: 'relative' }}>
      <Box className={classes.bgImage}></Box>

      <Title order={2} mb="md" position="relative" fw="lighter">
        {title}
      </Title>
      <SimpleGrid cols={{ base: 1, sm: 2, md: 2 }} spacing="lg" mt="xl">
        {bullets.map((bullet, i) => (
          <Flex key={i} gap="md">
            <ThemeIcon variant="light" size="md">
              <IconStar size="70%" stroke={1.5} />
            </ThemeIcon>
            <Text>{bullet}</Text>
          </Flex>
        ))}
      </SimpleGrid>
    </Box>
  );
}
