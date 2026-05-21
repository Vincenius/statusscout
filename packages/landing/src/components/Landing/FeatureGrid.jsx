import { Card, Text, Title, SimpleGrid, ThemeIcon, Flex } from "@mantine/core";
import classes from './Landing.module.css';

export default function FeatureGrid({ features }) {
  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg" mx="auto" py="8em">
      {features.map((feature, index) => (
        <Card key={index} shadow="md" radius="md" p="lg" withBorder>
          <Flex gap="md" align="flex-start">
            <ThemeIcon variant="light" size={44} style={{ flexShrink: 0 }}>
              <feature.icon size="70%" stroke={1.5} />
            </ThemeIcon>
            <Title order={2} size="h4" className={classes.featureTitle}>{feature.title}</Title>
          </Flex>
          <Text size="sm" mt="md" c="dimmed">
            {feature.description}
          </Text>
        </Card>
      ))}
    </SimpleGrid>
  );
}
