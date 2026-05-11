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
  // If user entered without scheme, default to https
  if (!/^https?:\/\//i.test(value)) {
    return `https://${value}`;
  }
  return value;
}

const PRODUCT_NAMES = ['Website', 'Lovable app', 'Cursor site', 'Bolt app', 'v0 build'];

export default function Hero() {
  const formRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [productIndex, setProductIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProductIndex(i => (i + 1) % PRODUCT_NAMES.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);
  const { colorScheme } = useMantineColorScheme();
  const heroImage = colorScheme === 'dark'
    ? '/screenshot-dark.png'
    : '/screenshot-light.png';

  const form = useForm({
    initialValues: {
      url: '',
    },
    validate: {
      url: (value) => isValidUrl(value) ? null : 'Please enter a valid URL',
    },
  });

  const handleSubmit = ({ url }) => {
    const formData = new FormData(formRef.current)
    const token = formData.get('cf-turnstile-response')
    const normalizedUrl = normalizeUrl(url.trim());

    if (!isValidUrl(normalizedUrl)) {
      form.setFieldError('url', 'Please enter a valid URL');
      return;
    }

    const parsed = new URL(normalizedUrl);
    const finalUrl = parsed.origin;

    setLoading(true)
    trackEvent('quickcheck', { url: finalUrl })
    fetch(`${import.meta.env.VITE_API_URL}/v1/quickcheck`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        url: finalUrl,
        turnstileToken: token,
      }),
    }).then(res => res.json())
      .then(res => {
        if (res.error) {
          form.setFieldError('url', res.error);
          return;
        } else {
          if (res.statusCode === 200 && res.quickcheckId) {
            window.location.href = `${import.meta.env.VITE_APP_URL}/quickcheck?id=${res.quickcheckId}`
          } else {
            form.setFieldError('url', `Could not reach ${url} [Status: ${res.statusCode}]`);
          }
        }
      }).finally(() => {
        setLoading(false)
      })
  };

  return (
    <Flex w="100%" mx="auto" my="4em" gap="xl" justify="space-between" direction={{ base: 'column', md: 'row' }} align={{ base: 'center', md: 'initial' }}>
      <Box className={classes.bgPattern}></Box>

      <Flex w="100%" maw={700} direction="column" justify="space-around" gap={{ base: 'xl', md: '0' }}>
        <Title order={1} fw="100" className={classes.title}>
          Your{' '}
          <span style={{ display: 'inline-grid', verticalAlign: 'bottom' }}>
            {PRODUCT_NAMES.map((name, i) => (
              <span
                key={name}
                className={classes.highlight}
                style={{
                  gridColumn: 1,
                  gridRow: 1,
                  whiteSpace: 'nowrap',
                  opacity: i === productIndex ? 1 : 0,
                  transform: i === productIndex ? 'translateY(0)' : 'translateY(0.35em)',
                  transition: 'opacity 0.5s ease, transform 0.5s ease',
                  textAlign: 'center',
                }}
              >
                {name}
              </span>
            ))}
          </span>
          {' '}is live.<br />
          But is it safe?
        </Title>

        <Text size="xl" maw={600}>
          AI-built apps ship with 2.74× more vulnerabilities. StatusScout finds the security holes AIs leave behind and gives you ready-to-paste prompts to fix each one.
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
            <Text size="lg">Scan your site in seconds — no account needed</Text>
          </Flex>

          {import.meta.env.VITE_TURNSTILE_SITE_KEY && <Box mb="lg">
            <Turnstile siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
              options={{
                theme: colorScheme === 'dark' ? 'dark' : 'light',
                appearance: 'interaction-only',
              }} />
          </Box>}
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
            View on GitHub — free & open source
          </Flex>
        </Anchor>
      </Flex>

      <Image src={heroImage} alt="StatusScout security scan screenshot" w={300} />
    </Flex>
  );
}
