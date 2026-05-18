import { useState, useRef, useEffect } from 'react'
import { useForm } from '@mantine/form';
import { ActionIcon, Anchor, Box, Flex, Image, Text, TextInput, ThemeIcon, Title, useMantineColorScheme } from '@mantine/core'
import { IconArrowRight, IconBrandGithub, IconSearch } from '@tabler/icons-react'
import { trackEvent } from '@/utils/trackEvent'
import { Turnstile } from '@marsidev/react-turnstile'
import classes from './Landing.module.css';

function isValidUrl(value) {
  try {
    const url = new URL(normalizeUrl(value));
    const isHttp = url.protocol === 'http:' || url.protocol === 'https:';
    const hasValidHostname =
      /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(url.hostname) ||
      /^[\d.]+$/.test(url.hostname);
    return isHttp && hasValidHostname;
  } catch (_) {
    return false;
  }
}

function normalizeUrl(value) {
  if (!/^https?:\/\//i.test(value)) {
    return `https://${value}`;
  }
  return value;
}

export default function Hero({ rotatingWords, renderTitle, description }) {
  const formRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);
  const { colorScheme } = useMantineColorScheme();

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex(i => (i + 1) % rotatingWords.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [rotatingWords.length]);

  const heroImage = colorScheme === 'dark' ? '/screenshot-dark.png' : '/screenshot-light.png';

  const form = useForm({
    initialValues: { url: '' },
    validate: {
      url: (value) => isValidUrl(value) ? null : 'Please enter a valid URL',
    },
  });

  const handleSubmit = ({ url }) => {
    const formData = new FormData(formRef.current);
    const token = formData.get('cf-turnstile-response');
    const normalizedUrl = normalizeUrl(url.trim());

    if (!isValidUrl(normalizedUrl)) {
      form.setFieldError('url', 'Please enter a valid URL');
      return;
    }

    const finalUrl = new URL(normalizedUrl).origin;
    setLoading(true);
    trackEvent('quickcheck', { url: finalUrl });

    fetch(`${import.meta.env.VITE_API_URL}/v1/quickcheck`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ url: finalUrl, turnstileToken: token }),
    })
      .then(res => res.json())
      .then(res => {
        if (res.error) {
          form.setFieldError('url', res.error);
        } else if (res.statusCode === 200 && res.quickcheckId) {
          window.location.href = `${import.meta.env.VITE_APP_URL}/quickcheck?id=${res.quickcheckId}`;
        } else {
          form.setFieldError('url', `Could not reach ${url} [Status: ${res.statusCode}]`);
        }
      })
      .finally(() => setLoading(false));
  };

  const rotatingSpan = (
    <span style={{ display: 'inline-grid', verticalAlign: 'bottom' }}>
      {rotatingWords.map((word, i) => (
        <span
          key={word}
          className={classes.highlight}
          style={{
            gridColumn: 1,
            gridRow: 1,
            whiteSpace: 'nowrap',
            opacity: i === wordIndex ? 1 : 0,
            transform: i === wordIndex ? 'translateY(0)' : 'translateY(0.35em)',
            transition: 'opacity 0.5s ease, transform 0.5s ease',
          }}
        >
          {word}
        </span>
      ))}
    </span>
  );

  return (
    <Flex w="100%" mx="auto" my="4em" gap="xl" justify="space-between" direction={{ base: 'column', md: 'row' }} align={{ base: 'center', md: 'initial' }}>
      <Box className={classes.bgPattern}></Box>

      <Flex w="100%" maw={700} direction="column" justify="space-around" gap={{ base: 'xl', md: '0' }}>
        <Title order={1} fw="100" className={classes.title}>
          {renderTitle(rotatingSpan)}
        </Title>

        <Text size="xl" maw={600}>
          {description}
        </Text>

        <form onSubmit={form.onSubmit(handleSubmit)} ref={formRef}>
          <Flex w="100%">
            <TextInput
              placeholder="https://www.yourdomain.com"
              size="xl"
              variant="filled"
              w="100%"
              {...form.getInputProps('url')}
              styles={{
                input: {
                  borderTopRightRadius: 0,
                  borderBottomRightRadius: 0,
                },
              }}
            />
            <ActionIcon
              variant="filled"
              radius="md"
              type="submit"
              aria-label="Run Check"
              w={60}
              h={60}
              loading={loading}
              style={{
                borderTopLeftRadius: 0,
                borderBottomLeftRadius: 0,
              }}
            >
              <IconArrowRight stroke={1.5} />
            </ActionIcon>
          </Flex>
          <Flex gap="sm" align="center" mt="xs" mb={import.meta.env.VITE_TURNSTILE_SITE_KEY ? "sm" : "xl"}>
            <ThemeIcon variant="light" size="md">
              <IconSearch style={{ width: '70%', height: '70%' }} />
            </ThemeIcon>
            <Text size="lg">Free scan, no account needed</Text>
          </Flex>

          {import.meta.env.VITE_TURNSTILE_SITE_KEY && (
            <Box mb="lg">
              <Turnstile
                siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
                options={{
                  theme: colorScheme === 'dark' ? 'dark' : 'light',
                  appearance: 'interaction-only',
                }}
              />
            </Box>
          )}
        </form>

        <Anchor
          href="https://github.com/vincenius/statusscout"
          target="_blank"
          rel="noopener"
          c="dimmed"
          size="sm"
          mt="xs"
        >
          <Flex gap="xs" align="center">
            <IconBrandGithub size={16} />
            Open source on GitHub. Free forever.
          </Flex>
        </Anchor>
      </Flex>

      <Image src={heroImage} alt="StatusScout security scan screenshot" w={300} />
    </Flex>
  );
}
