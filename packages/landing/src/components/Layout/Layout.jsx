import { Text, Flex, Box, Divider, ThemeIcon, Button, Menu, Burger } from '@mantine/core'
import { Helmet } from 'react-helmet-async';
import { IconBrandBluesky, IconBrandGithub, IconHeartbeat, IconMug } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import ColorSchemeToggle from './ColorSchemeToggle.jsx';
import { useEffect, useState } from 'react';
import InlineLink from '@/components/InlineLink/InlineLink.jsx';
import { useLocation } from 'react-router-dom';
// import { useCookieConsent } from "react-cookie-manager";

const NAV_LINKS = [
  { label: 'Blog', to: '/blog' },
];

const Layout = ({ children, title, description, ogImage }) => {
  // const { detailedConsent } = useCookieConsent();
  const isAnalyticsEnabled = import.meta.env.VITE_ENABLE_ANALYTICS === 'true' || import.meta.env.VITE_ENABLE_ANALYTICS === true;
  const [opened, setOpened] = useState(false);
  const location = useLocation();

  // set head info on initial load
  useEffect(() => {
    if (isAnalyticsEnabled && !document.querySelector('[data-website-id]')) {
      const script = document.createElement('script');
      script.src = 'https://analytics.vincentwill.com/script.js';
      script.defer = true;
      script.setAttribute('data-website-id', 'a807669d-6eda-4c1c-9b36-2247d2caf318');
      script.setAttribute("crossOrigin", "anonymous");
      script.setAttribute("integrity", "sha384-P1BInfZdoZSf0uwq2HjkM5eTgAyjX7ZFPgf5pFvS2Ms82o4zgeEPBReA95B8XxJN")
      document.head.appendChild(script);
    }
    if (document.title !== `${title} | StatusScout`) {
      document.title = `${title} | StatusScout`
    }
  });

  // gtag
  // useEffect(() => {
  //   const GTM_ID = import.meta.env.VITE_GTM_ID;
  //   if (!GTM_ID) return;

  //   const inline = document.createElement('script');
  //   inline.innerHTML = `
  //     window.dataLayer = window.dataLayer || [];
  //     function gtag(){dataLayer.push(arguments);}
  //     window.gtag = gtag;

  //     gtag('consent', 'default', {
  //       ad_storage: 'denied',
  //       analytics_storage: 'denied',
  //       ad_personalization: 'denied',
  //       wait_for_update: 500
  //     });
  //   `;
  //   document.head.appendChild(inline);

  //   const script = document.createElement('script');
  //   script.src = `https://www.googletagmanager.com/gtag/js?id=${GTM_ID}`;
  //   script.async = true;
  //   document.head.appendChild(script);

  //   return () => {
  //     document.head.removeChild(script);
  //     document.head.removeChild(inline);
  //   };
  // }, []);

  // useEffect(() => {
  //   if (!window.gtag) return;

  //   const analyticsAllowed = detailedConsent?.Analytics?.consented;
  //   const adsAllowed = detailedConsent?.Advertising?.consented;

  //   // Update consent
  //   window.gtag('consent', 'update', {
  //     analytics_storage: analyticsAllowed ? 'granted' : 'denied',
  //     ad_storage: adsAllowed ? 'granted' : 'denied',
  //     ad_personalization: adsAllowed ? 'granted' : 'denied'
  //   });

  //   // Fire GA config only if analytics is allowed
  //   if (analyticsAllowed) {
  //     window.gtag('js', new Date());
  //     window.gtag('config', import.meta.env.VITE_GTM_ID, {
  //       send_page_view: true
  //     });
  //   }

  // }, [detailedConsent, window.gtag]);

  // handle gtag location changes
  useEffect(() => {
    if (window.gtag) {
      window.gtag('config', import.meta.env.VITE_GTM_ID, {
        page_path: window.location.pathname,
      });
    }
  }, [location.pathname]);

  return <>
    <Helmet>
      <title>{`${title} | StatusScout`}</title>
      {description && <meta name="description" content={description} />}
      <meta property="og:title" content={`${title} | StatusScout`} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:image" content={ogImage || `${import.meta.env.VITE_LANDING_URL || ''}/og.png`} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:image" content={ogImage || `${import.meta.env.VITE_LANDING_URL || ''}/og.png`} />
      {isAnalyticsEnabled && (<script defer src="https://analytics.vincentwill.com/script.js" data-website-id="a807669d-6eda-4c1c-9b36-2247d2caf318" integrity="sha384-P1BInfZdoZSf0uwq2HjkM5eTgAyjX7ZFPgf5pFvS2Ms82o4zgeEPBReA95B8XxJN" crossOrigin="anonymous"></script>)}
    </Helmet>

    <Flex align="center" justify="space-between" h="100%" gap="lg" maw={1200} mx="auto" py="xs" px="xl">
      <Flex gap="4em">
        <Flex gap="xs" align="center" component={Link} to="/" c="inherit" td="none">
          <IconHeartbeat size={26} stroke={0.8} />
          <Text size="xl" fw={200}>StatusScout</Text>
        </Flex>
        {/* later add nav here */}
        {/* <Flex gap="md" align="center" display={{ base: 'none', xs: 'flex' }}>
          {NAV_LINKS.map(link => {
            const isActive = location.pathname.startsWith(link.to);
            return (
              <Text
                key={link.to}
                component={Link}
                to={link.to}
                size="md"
                fw={isActive ? 500 : 400}
                // c={isActive ? 'primary' : 'dimmed'}
                td="none"
                style={{
                  transition: 'color 0.15s, border-color 0.15s',
                }}
              >
                {link.label}
              </Text>
            );
          })}
        </Flex> */}
      </Flex>


      <Flex gap="md" align="center">
        <Flex gap="md" align="center" display={{ base: 'none', xs: 'flex' }}>
          <Button size="xs" component="a" href={`${import.meta.env.VITE_APP_URL}/login`} variant="outline">
            Login
          </Button>
          <Button size="xs" component="a" href={`${import.meta.env.VITE_APP_URL}/register`}>
            Sign-up
          </Button>
        </Flex>

        <ColorSchemeToggle />

        <Menu shadow="md" width={200} display={{ base: 'block', xs: 'none' }} opened={opened} onChange={setOpened}>
          <Menu.Target>
            <Burger opened={opened} aria-label="Toggle navigation" />
          </Menu.Target>

          <Menu.Dropdown>
            {NAV_LINKS.map(link => (
              <Menu.Item
                key={link.to}
                component={Link}
                to={link.to}
                fw={location.pathname.startsWith(link.to) ? 600 : 400}
                c={location.pathname.startsWith(link.to) ? 'primary' : 'inherit'}
              >
                {link.label}
              </Menu.Item>
            ))}
            <Menu.Divider />
            <Menu.Item>
              <Button size="xs" component="a" href={`${import.meta.env.VITE_APP_URL}/login`} variant="outline" fullWidth>
                Login
              </Button>
            </Menu.Item>
            <Menu.Item>
              <Button size="xs" component="a" href={`${import.meta.env.VITE_APP_URL}/register`} fullWidth>
                Sign-up
              </Button>
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Flex>
    </Flex>

    <Divider my="0" />

    <Box px="xl" maw={1200} mx="auto" mih="80vh" style={{ position: 'relative' }}>
      {children}
    </Box>

    <Divider mb="1em" />

    <footer>
      <Flex py="xl" px="xl" w="100%" maw={1200} mx="auto" justify="space-between" direction={{ base: 'column', sm: 'row' }} gap={{ base: 'xl', sm: 'md' }} align={{ base: 'center', sm: 'flex-start' }}>
        <Flex gap="md" direction="column" align={{ base: 'center', sm: 'flex-start' }} maw={200}>
          <Flex gap="xs" align="center" component={Link} to="/" c="inherit" td="none">
            <IconHeartbeat size={20} stroke={0.8} />
            <Text size="md" fw={200}>StatusScout</Text>
          </Flex>
          <Box ta={{ base: 'center', sm: 'left' }}>
            <Text size="sm" c="dimmed">Made and hosted in the EU 🇪🇺</Text>
            <Text size="sm" c="dimmed">Runs on renewable energy 🍃</Text>
          </Box>
        </Flex>

        <Flex gap={{ base: 'xl', sm: "5em"}} direction={{ base: 'column', sm: 'row' }} align={{ base: 'center', sm: 'flex-start' }}>
          <Flex gap="xs" direction="column" align={{ base: 'center', sm: 'flex-start' }}>
            <Text size="xs" fw={600} tt="uppercase" c="dimmed" mb={4}>Product</Text>
            <Text size="sm"><InlineLink to="/blog">Blog</InlineLink></Text>
          </Flex>

          <Flex gap="xs" direction="column" align={{ base: 'center', sm: 'flex-start' }}>
            <Text size="xs" fw={600} tt="uppercase" c="dimmed" mb={4}>Legal</Text>
            <Text size="sm"><InlineLink to="/imprint">Imprint</InlineLink></Text>
            <Text size="sm"><InlineLink to="/privacy">Privacy</InlineLink></Text>
          </Flex>

          <Flex gap="xs" direction="column" align={{ base: 'center', sm: 'flex-start' }}>
            <Text size="xs" fw={600} tt="uppercase" c="dimmed" mb={4}>Follow</Text>
            <Flex gap="xs">
              <a href="https://github.com/vincenius/statusscout" target="_blank" rel="noopener noreferrer">
                <ThemeIcon variant="light" size="lg" aria-label="GitHub">
                  <IconBrandGithub size={20} />
                </ThemeIcon>
              </a>
              <a href="https://bsky.app/profile/vincentwill.com" target="_blank" rel="noopener noreferrer">
                <ThemeIcon variant="light" size="lg" aria-label="Bluesky">
                  <IconBrandBluesky size={20} />
                </ThemeIcon>
              </a>
              <a href="https://ko-fi.com/wweb_dev" target="_blank" rel="noopener noreferrer">
                <ThemeIcon variant="light" size="lg" aria-label="Ko-fi">
                  <IconMug size={20} />
                </ThemeIcon>
              </a>
            </Flex>
          </Flex>
        </Flex>
      </Flex>

      <Divider />
      <Text size="sm" ta="center" py="md" c="dimmed">© {new Date().getFullYear()} StatusScout</Text>
    </footer>
  </>
}

export default Layout
