import Layout from '@/components/Layout/Layout'
import { Flex } from '@mantine/core'
import Features from '@/components/Landing/Features';
import Hero from '@/components/Landing/Hero';
import SocialProof from '@/components/Landing/SocialProof';
import Roadmap from '@/components/Landing/Roadmap';
import Pricing from '@/components/Landing/Pricing';

function Landing() {
  return (
    <Layout title="Finds the security holes AIs leave behind" >
      <Flex mx="auto" mih="80vh" align="center">
        <Hero />
      </Flex>

      <Features />

      <SocialProof />

      <Pricing />

      <Roadmap />

    </Layout>
  )
}

export default Landing
