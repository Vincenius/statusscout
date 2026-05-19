import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Title, Text, Image, Skeleton, Anchor } from '@mantine/core';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Layout from '@/components/Layout/Layout';
import { getPost } from '@/utils/blog';
import classes from './post.module.css';

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState(undefined);

  useEffect(() => {
    getPost(slug).then(setPost);
  }, [slug]);

  if (post === undefined) {
    return (
      <Layout title="Loading…">
        <Box maw={720} mx="auto" py="xl">
          <Skeleton height={400} mb="xl" radius="md" />
          <Skeleton height={32} mb="md" />
          <Skeleton height={16} mb="xs" />
          <Skeleton height={16} mb="xs" />
          <Skeleton height={16} width="60%" />
        </Box>
      </Layout>
    );
  }

  if (post === null) {
    return (
      <Layout title="Post not found">
        <Box maw={720} mx="auto" py="xl">
          <Title order={1} mb="md">Post not found</Title>
          <Anchor component={Link} to="/blog">← Back to blog</Anchor>
        </Box>
      </Layout>
    );
  }

  const formattedDate = post.date
    ? new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  return (
    <Layout title={post.title} description={post.description} ogImage={post.ogImage || post.image}>
      <Box maw={720} mx="auto" py="xl">
        <Anchor component={Link} to="/blog" size="sm" mb="xl" display="block">
          ← Back to blog
        </Anchor>

        {post.image && (
          <Image
            src={post.image}
            radius="md"
            mb="xl"
            alt={post.title}
            style={{ maxHeight: 400, objectFit: 'cover', width: '100%' }}
          />
        )}

        <Title order={1} mb="xs">{post.title}</Title>
        {formattedDate && <Text c="dimmed" size="sm" mb="xl">{formattedDate}</Text>}

        <Box className={classes.prose}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {post.body}
          </ReactMarkdown>
        </Box>
      </Box>
    </Layout>
  );
}
