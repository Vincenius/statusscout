import Layout from '@/components/Layout/Layout';
import { Container, Title, Text, Center, Card, ThemeIcon, Flex, Button, LoadingOverlay, Switch, Badge, useMantineColorScheme } from '@mantine/core';
import { useCallback, useEffect, useState } from "react";
import { loadStripe } from '@stripe/stripe-js';
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout
} from '@stripe/react-stripe-js';
import { useAuthSWR } from '@/utils/useAuthSWR'
import { useNavigate } from 'react-router-dom';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const PLANS = {
  base: {
    label: 'Base',
    monthly: { pricePerMonth: 24, type: 'base-monthly' },
    yearly: { pricePerMonth: 19, type: 'base-yearly' },
    websites: 5,
    description: 'Perfect for freelancers and small teams.',
  },
  agency: {
    label: 'Agency',
    monthly: { pricePerMonth: 39, type: 'agency-monthly' },
    yearly: { pricePerMonth: 35, type: 'agency-yearly' },
    websites: 20,
    description: 'Built for agencies managing multiple client sites.',
  },
};

function Checkout() {
  const navigate = useNavigate();
  const [isYearly, setIsYearly] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState();
  const { data: user } = useAuthSWR(`${import.meta.env.VITE_API_URL}/v1/user`)
  const { colorScheme } = useMantineColorScheme();

  const selectPlan = (tier) => {
    const billing = isYearly ? 'yearly' : 'monthly';
    setSelectedPlan(PLANS[tier][billing].type);
  }

  const fetchClientSecret = useCallback(() => {
    return fetch(`${import.meta.env.VITE_API_URL}/v1/checkout/session`, {
      method: "POST",
      body: JSON.stringify({ type: selectedPlan, colorScheme }),
      headers: {
        "Content-Type": "application/json",
      },
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data) => data.clientSecret)
  }, [selectedPlan]);

  const options = { fetchClientSecret };

  const baseSavings = Math.round(((PLANS.base.monthly.pricePerMonth - PLANS.base.yearly.pricePerMonth) / PLANS.base.monthly.pricePerMonth) * 100);
  const agencySavings = Math.round(((PLANS.agency.monthly.pricePerMonth - PLANS.agency.yearly.pricePerMonth) / PLANS.agency.monthly.pricePerMonth) * 100);

  useEffect(() => {
    if (user?.subscription?.plan === 'pro' && !user?.subscription?.expiresAt) {
      navigate('/settings');
    }
  }, [user]);

  return (
    <Layout title="Checkout">
      <Container size="lg" py={40}>
        {!selectedPlan && <>
          <Title order={2} align="center" mb="sm">Choose your plan</Title>

          <Flex justify="center" mb="xl">
            <Switch
              checked={!isYearly}
              onChange={(event) => setIsYearly(!event.currentTarget.checked)}
              label="Monthly billing"
            />
          </Flex>

          <Flex gap="xl" justify="center" maw={700} mx="auto">
            {Object.entries(PLANS).map(([tier, plan]) => {
              const billing = isYearly ? plan.yearly : plan.monthly;
              const savings = tier === 'base' ? baseSavings : agencySavings;
              return (
                <Card
                  key={tier}
                  shadow="sm"
                  padding="lg"
                  radius="md"
                  withBorder
                  w="100%"
                  style={{ cursor: 'pointer', borderColor: tier === 'base' ? 'var(--mantine-primary-color-6)' : undefined }}
                  onClick={() => selectPlan(tier)}
                >
                  <Flex justify="space-between" align="flex-start">
                    <Title order={4} mt="sm">{plan.label}</Title>
                    {isYearly && <Badge color="green" variant="light">Save {savings}%</Badge>}
                  </Flex>
                  <Text size="lg" mt="xs"><b>${billing.pricePerMonth}</b>/month</Text>
                  <Text size="sm" c="dimmed">{isYearly ? 'Billed annually' : 'Billed monthly'}</Text>
                  <Text size="sm" mt="sm">{plan.description}</Text>
                  <Text size="sm" mt="xs" c="dimmed">Up to {plan.websites} websites</Text>
                </Card>
              );
            })}
          </Flex>
        </>}

        {selectedPlan && <>
          <EmbeddedCheckoutProvider
            stripe={stripePromise}
            options={options}
          >
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>

          <Flex justify="center" mt="xl">
            <Button variant="outline" mx="auto" onClick={() => setSelectedPlan(null)}>Back to plan selection</Button>
          </Flex>
        </>}
      </Container>
    </Layout>
  );
}

export default Checkout;
