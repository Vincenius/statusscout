import Layout from '@/components/Layout/Layout';
import { Box, Title, Text, Button } from '@mantine/core';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <Layout title="Page Not Found" description="The page you are looking for does not exist.">
      <Box maw={600} mx="auto" px="md" py="xl" ta="center">
        <Text size="6rem" fw={200} lh={1}>404</Text>
        <Title order={1} mb="md">Page not found</Title>
        <Text c="dimmed" mb="xl">
          The page you are looking for does not exist or has been moved.
        </Text>
        <Button component={Link} to="/">Back to home</Button>
      </Box>
    </Layout>
  );
};

export default NotFound;
