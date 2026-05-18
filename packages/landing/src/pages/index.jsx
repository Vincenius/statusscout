import Layout from '@/components/Layout/Layout'
import { Flex } from '@mantine/core'
import Hero from '@/components/Landing/Hero';
import FeatureGrid from '@/components/Landing/FeatureGrid';
import SocialProof from '@/components/Landing/SocialProof';
import Roadmap from '@/components/Landing/Roadmap';
import Pricing from '@/components/Landing/Pricing';
import {
  IconHeartbeat,
  IconShieldLock,
  IconLock,
  IconFileAlert,
  IconCode,
  IconNetwork,
} from '@tabler/icons-react';

const ROTATING_WORDS = ['secure?'];

const FEATURES = [
  {
    icon: IconHeartbeat,
    title: "Know the moment your site goes down",
    description:
      "We monitor your uptime 24/7 and alert you instantly when your site stops responding.",
  },
  {
    icon: IconLock,
    title: "Prevent SSL issues before visitors see warnings",
    description:
      "Track SSL expiration dates and get alerted before certificates expire.",
  },
  {
    icon: IconShieldLock,
    title: "Catch missing security headers automatically",
    description:
      "We scan your site for critical browser security headers and show you exactly what needs fixing.",
  },
  {
    icon: IconNetwork,
    title: "Detect subdomain takeover risks early",
    description:
      "Find vulnerable subdomains and monitor SPF, DKIM, and DMARC records before attackers do.",
  },
  {
    icon: IconFileAlert,
    title: "Find exposed secrets and config files",
    description:
      "We check for accidentally public env files, API keys, and sensitive credentials.",
  },
  {
    icon: IconCode,
    title: "Monitor critical user flows automatically",
    description:
      "Run scheduled tests for signup, checkout, and other key flows — and get alerted when they fail.",
  },
];

const SOCIAL_BULLETS = [
  'Free scan, no signup required',
  'Works on any stack or framework',
  'Self-hostable, you own your data',
  'Alerts via email, SMS, or ntfy',
];

function Landing() {
  return (
    <Layout title="Security and uptime monitoring for developers">
      <Flex mx="auto" mih="80vh" align="center">
        <Hero
          rotatingWords={ROTATING_WORDS}
          renderTitle={(spinner) => <>Your app is live.<br />But is it {spinner}</>}
          description="StatusScout monitors security headers, SSL certificates, DNS records, uptime, and exposed files. You get an alert the moment something goes wrong."
        />
      </Flex>

      <FeatureGrid features={FEATURES} />

      <SocialProof
        title={<>We've run security scans on <b>10,000+</b> websites</>}
        bullets={SOCIAL_BULLETS}
      />

      <Pricing />

      <Roadmap />
    </Layout>
  )
}

export default Landing
