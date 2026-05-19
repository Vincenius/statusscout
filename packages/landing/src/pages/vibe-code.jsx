import Layout from '@/components/Layout/Layout'
import { Flex } from '@mantine/core'
import Hero from '@/components/Landing/Hero';
import FeatureGrid from '@/components/Landing/FeatureGrid';
import SocialProof from '@/components/Landing/SocialProof';
import Roadmap from '@/components/Landing/Roadmap';
import Pricing from '@/components/Landing/Pricing';
import {
  IconShieldLock,
  IconFileAlert,
  IconLock,
  IconApi,
  IconCookie,
  IconBug,
  IconSparkles,
} from '@tabler/icons-react';

const ROTATING_WORDS = ['Lovable app', 'Cursor site', 'Bolt app', 'v0 build'];

const FEATURES = [
  {
    icon: IconFileAlert,
    title: "Your password file might be readable by anyone",
    description:
      "API keys, database passwords, secret tokens. If these files are accidentally served by your app, anyone on the internet can grab them.",
  },
  {
    icon: IconApi,
    title: "Your API docs might be open to everyone",
    description:
      "Tools like FastAPI and Swagger publish your full API layout by default. Anyone can browse your endpoints and figure out how to break in.",
  },
  {
    icon: IconShieldLock,
    title: "Invisible protections your app is probably missing",
    description:
      "There are browser-level security settings AI tools almost never turn on. We check which ones are missing and tell you exactly what to add.",
  },
  {
    icon: IconCookie,
    title: "Your login sessions could be hijacked",
    description:
      "Login cookies need specific security flags. Without them, attackers can steal user sessions through other holes in your site.",
  },
  {
    icon: IconBug,
    title: "Your error pages might be leaking your code",
    description:
      "When something breaks, the error page should not show file paths or stack traces. We check if your app is accidentally exposing that.",
  },
  {
    icon: IconSparkles,
    title: "Every issue comes with an AI fix prompt",
    description:
      "Each problem we find includes a ready-made prompt for Cursor, Claude, or ChatGPT. Copy, paste, and get step-by-step fix instructions. No security expertise needed.",
  },
];

const SOCIAL_BULLETS = [
  'Free scan, no signup required',
  'Open source on GitHub',
  'Self-hostable, you own your data',
  'AI fix prompts for every issue',
];

function VibecodeLanding() {
  return (
    <Layout title="Finds the security holes AIs leave behind" description="AI-built apps ship with more vulnerabilities than hand-written ones. StatusScout finds exposed secrets, missing security headers, and open API docs, then generates a fix prompt for each issue." ogImage="/og-ai.png">
      <Flex mx="auto" mih="80vh" align="center">
        <Hero
          rotatingWords={ROTATING_WORDS}
          renderTitle={(spinner) => <>Your {spinner} is live.<br />But is it safe?</>}
          description="AI-built apps ship with 2.74x more vulnerabilities. StatusScout finds the holes they leave behind and generates a fix prompt for each one."
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

export default VibecodeLanding
