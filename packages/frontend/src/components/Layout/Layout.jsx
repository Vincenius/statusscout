import { Text, Flex, Burger, AppShell, NavLink, Box, LoadingOverlay, Loader, ActionIcon, Menu, ScrollArea, Blockquote, Button, Alert } from '@mantine/core'
import { Helmet } from 'react-helmet-async';
import { useDisclosure } from '@mantine/hooks';
import { IconAppWindow, IconCirclePlus, IconDashboard, IconHeartbeat, IconLogout, IconSettings } from '@tabler/icons-react';
import { Link, useNavigate } from 'react-router-dom';
import ColorSchemeToggle from './ColorSchemeToggle.jsx';
import { useEffect, useState } from 'react';
import { useAuthSWR } from '@/utils/useAuthSWR'
import FeedbackButton from '@/components/FeedbackButton/FeedbackButton.jsx';
import InlineLink from '@/components/InlineLink/InlineLink.jsx';
import { useLocation } from 'react-router-dom';
// import { useCookieConsent } from "react-cookie-manager";

const Layout = ({ children, title, isPublicRoute, redirectIfAuth, logoLink }) => {
  // const { detailedConsent } = useCookieConsent();
  const [opened, { toggle }] = useDisclosure();
  const [menuOpened, setMenuOpened] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const navigate = useNavigate();
  const isAnalyticsEnabled = import.meta.env.VITE_ENABLE_ANALYTICS === 'true' || import.meta.env.VITE_ENABLE_ANALYTICS === true;
  const { data: user = {}, isLoading: isLoadingUser } = !isPublicRoute
    ? useAuthSWR(`${import.meta.env.VITE_API_URL}/v1/user`)
    : { data: {}, error: null, isLoading: false };
  const { data: websites = [], isLoading: isLoadingWebsite } = !isPublicRoute
    ? useAuthSWR(`${import.meta.env.VITE_API_URL}/v1/website`)
    : { data: [], error: null, isLoading: false };

  const expiresAt = new Date(user?.subscription?.expiresAt);
  const now = new Date();
  const hasStripe = Boolean(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
  const registrationDisabled = import.meta.env.VITE_DISABLE_REGISTRATION === 'true' || import.meta.env.VITE_DISABLE_REGISTRATION === true
  const { data: regData } = registrationDisabled
    ? useAuthSWR(`${import.meta.env.VITE_API_URL}/v1/user/registration`)
    : { data: { adminRegistration: false } };
  const { adminRegistration } = regData || {};
  const location = useLocation();

  useEffect(() => {
    if (registrationDisabled && adminRegistration) {
      navigate("/register");
    }
  }, [registrationDisabled, adminRegistration]);

  // set head info on initial load
  useEffect(() => {
    if (isAnalyticsEnabled && !document.querySelector('[data-website-id]')) {
      const script = document.createElement('script');
      script.src = 'https://www.googletagmanager.com/gtag/js?id=AW-17723627610';
      script.defer = true;
      script.setAttribute('data-website-id', 'a807669d-6eda-4c1c-9b36-2247d2caf318');
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

  //   window.gtag('consent', 'update', {
  //     analytics_storage: analyticsAllowed ? 'granted' : 'denied',
  //     ad_storage: adsAllowed ? 'granted' : 'denied',
  //     ad_personalization: adsAllowed ? 'granted' : 'denied'
  //   });

  //   if (analyticsAllowed) {
  //     window.gtag('js', new Date());
  //     window.gtag('config', import.meta.env.VITE_GTM_ID, {
  //       send_page_view: true
  //     });
  //   }

  // }, [detailedConsent, window.gtag]);

  // // handle gtag location changes
  // useEffect(() => {
  //   if (window.gtag) {
  //     window.gtag('config', import.meta.env.VITE_GTM_ID, {
  //       page_path: window.location.pathname,
  //     });
  //   }
  // }, [location.pathname]);

  useEffect(() => {
    if (redirectIfAuth) {
      fetch(`${import.meta.env.VITE_API_URL}/v1/authenticated`, { credentials: 'include' })
        .then(res => {
          if (res.status === 200) {
            navigate('/dashboard');
          }
        });
    }
  }, [navigate]);

  return <>
    <Helmet>
      <title>{`${title} | StatusScout`}</title>
      {isAnalyticsEnabled && (<script defer src="https://analytics.vincentwill.com/script.js" data-website-id="a807669d-6eda-4c1c-9b36-2247d2caf318" integrity="sha384-OLBgp1GsljhM2TJ+sbHjaiH9txEUvgdDTAzHv2P24donTt6/529l+9Ua0vFImLlb" crossOrigin="anonymous"></script>)}
    </Helmet>
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: isPublicRoute ? 0 : 250,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      p="md"
    >
      <AppShell.Header px="md">
        <Flex align="center" h="100%" gap="lg">
          {!isPublicRoute && <Burger
            opened={opened}
            onClick={toggle}
            hiddenFrom="sm"
            size="sm"
          />}
          <Flex justify="space-between" w="100%">
            <Flex gap="xs" align="center" component={Link} to={logoLink || '/'} c="inherit" td="none">
              <IconHeartbeat size={26} stroke={0.8} />
              <Text size="xl" fw={200}>StatusScout</Text>
            </Flex>

            <Flex gap="md" align="center">
              {!user?.email && <Flex gap="md" display={{ base: 'none', xs: 'flex' }}>
                <Button size="xs" component={Link} to="/login" variant="outline">Login</Button>
                {!registrationDisabled && <Button size="xs" component={Link} to="/register">Sign-up</Button>}
              </Flex>}

              <ColorSchemeToggle />

              {!user?.email && <Menu shadow="md" width={200} display={{ base: 'block', xs: 'none' }} opened={menuOpened} onChange={setMenuOpened}>
                <Menu.Target>
                  <Burger opened={menuOpened} aria-label="Toggle navigation" />
                </Menu.Target>

                <Menu.Dropdown>
                  <Menu.Item>
                    <Button size="xs" component="a" href={`${import.meta.env.VITE_APP_URL}/login`} variant="outline" fullWidth>
                      Login
                    </Button>
                  </Menu.Item>
                  {!registrationDisabled && <Menu.Item>
                    <Button size="xs" component="a" href={`${import.meta.env.VITE_APP_URL}/register`} fullWidth>
                      Sign-up
                    </Button>
                  </Menu.Item>}
                </Menu.Dropdown>
              </Menu>}

              {user?.email && <Menu shadow="md" width={200}>
                <Menu.Target>
                  <ActionIcon
                    variant="default"
                    size="lg"
                    radius="md"
                    aria-label="Settings"
                  >
                    <IconSettings stroke={1.5} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Label>{user.email}</Menu.Label>
                  <Menu.Divider />
                  <Menu.Item
                    leftSection={<IconSettings size={14} />}
                    to={`/settings`}
                    component={Link}
                  >
                    Settings
                  </Menu.Item>
                  <Menu.Item
                    disabled={logoutLoading}
                    leftSection={<IconLogout size={16} stroke={1.5} />}
                    onClick={async () => {
                      setLogoutLoading(true)
                      await fetch(`${import.meta.env.VITE_API_URL}/v1/logout`, { credentials: 'include' })
                      await new Promise(resolve => setTimeout(resolve, 500));
                      setLogoutLoading(false)
                      navigate('/login')
                    }}>
                    <span>Logout {logoutLoading ? <Loader size="xs" /> : ""}</span>
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>}

            </Flex>
          </Flex>
        </Flex>
      </AppShell.Header>

      {!isPublicRoute && <AppShell.Navbar p="sm">
        <AppShell.Section grow component={ScrollArea}>
          <NavLink
            label="Dashboard"
            leftSection={<IconDashboard size={16} stroke={1.5} />}
            active={window.location.pathname === '/dashboard'}
            component={Link}
            to="/dashboard"
          />
          {websites.length > 0 && <Text size="sm" c="dimmed" mt="md" mb="xs" pl="sm">Websites</Text>}
          {websites.map(w => (
            <NavLink
              key={w.id}
              label={new URL(w?.domain).hostname}
              leftSection={<IconAppWindow size={16} stroke={1.5} />}
              defaultOpened={window.location.pathname.startsWith(`/website/${w.index}`)}
            >
              <NavLink
                label="Overview"
                to={`/website/${w.index}`}
                component={Link}
                active={window.location.pathname === `/website/${w.index}`}
              />
              <NavLink
                label="Report"
                to={`/website/${w.index}/report`}
                component={Link}
                active={window.location.pathname === `/website/${w.index}/report`}
              />
              <NavLink
                to={`/website/${w.index}/custom-flows`}
                label="Custom Test Flows"
                active={window.location.pathname === `/website/${w.index}/custom-flows`}
                component={Link}
              />
              <NavLink
                label="Settings"
                to={`/website/${w.index}/settings`}
                component={Link}
                active={window.location.pathname === `/website/${w.index}/settings`}
              />
            </NavLink>
          ))}
          <NavLink
            label="Add Website"
            leftSection={<IconCirclePlus size={16} stroke={1.5} />}
            active={window.location.pathname === '/website/new'}
            component={Link}
            disabled={(hasStripe && websites.length >= 5) || !user?.isProUser}
            to="/website/new"
          />
        </AppShell.Section>
        <AppShell.Section>
          {user?.subscription?.plan === 'trial' && <Blockquote p="sm" mb="md">
            {expiresAt < now ? "Your free trial ended" : `Trial active until ${expiresAt.toLocaleDateString()}`}<br />
            <InlineLink to="/checkout">Upgrade Plan</InlineLink>
          </Blockquote>}
          <FeedbackButton fullWidth variant="outline" email={user?.email}>Send Feedback</FeedbackButton>
        </AppShell.Section>
      </AppShell.Navbar>}

      <AppShell.Main>
        <Box>
          {(isLoadingUser || isLoadingWebsite) && <LoadingOverlay />}
          {(!isLoadingUser && !isLoadingWebsite) && <>
            {!isPublicRoute && user.email && !user.confirmed && (
              <Alert color="yellow" mb="md">
                Please confirm your email address to receive notifications.
              </Alert>
            )}
            {children}
          </>}
        </Box>
      </AppShell.Main>
    </AppShell>
  </>
}

export default Layout
