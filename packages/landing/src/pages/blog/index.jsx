import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Box, Title, Text, SimpleGrid, Card, Image, Badge, Skeleton } from '@mantine/core';
import Layout from '@/components/Layout/Layout';
import { getAllPosts } from '@/utils/blog';

export default function BlogIndex() {
  const [posts, setPosts] = useState(null);

  useEffect(() => {
    getAllPosts().then(setPosts);
  }, []);

  return (
    <Layout title="Blog" description="Thoughts on website monitoring, web security, and building StatusScout in public.">
      <Box py="xl">
        <Title order={1} mb="xs">Blog</Title>
        <Text c="dimmed" mb="xl">Thoughts on website monitoring, security, and building in public.</Text>

        {posts === null ? (
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
            {[1, 2, 3].map(i => <Skeleton key={i} height={280} radius="md" />)}
          </SimpleGrid>
        ) : posts.length === 0 ? (
          <Text c="dimmed">No posts yet — check back soon.</Text>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
            {posts.map(post => (
              <Card
                key={post.slug}
                component={Link}
                to={`/blog/${post.slug}`}
                shadow="sm"
                radius="md"
                withBorder
                style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column' }}
              >
                {post.image && (
                  <Card.Section>
                    <Image src={post.image} height={180} alt={post.title} fallbackSrc="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E" />
                  </Card.Section>
                )}
                <Box mt="sm" style={{ flex: 1 }}>
                  {post.date && (
                    <Badge variant="light" size="xs" mb="xs">
                      {new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </Badge>
                  )}
                  <Title order={3} size="h4" mb="xs">{post.title}</Title>
                  {post.description && <Text size="sm" c="dimmed" lineClamp={3}>{post.description}</Text>}
                </Box>
              </Card>
            ))}
          </SimpleGrid>
        )}
      </Box>
    </Layout>
  );
}
