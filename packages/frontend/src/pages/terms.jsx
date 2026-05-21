import { Container, Title, Text, Paper, ScrollArea } from '@mantine/core';
import Layout from "@/components/Layout/Layout";

export default function TermsPage() {
  return (
    <Layout title="Terms and Conditions" isPublicRoute>
      <Container size="sm">
        <Title order={1} mb="md">
          Terms and Conditions
        </Title>
        <Text color="dimmed" mb="xl">
          Last Updated: 2025-09-02
        </Text>

        <Text mb="sm">
          Welcome to StatusScout. By accessing or using our software-as-a-service (“SaaS”) platform, you agree to be bound by these Terms and Conditions (“Terms”). Please read them carefully.
        </Text>

        <Title order={2} mt="md" mb="sm">1. Acceptance of Terms</Title>
        <Text mb="sm">
          By creating an account, accessing, or using StatusScout, you agree to comply with these Terms and our Privacy Policy. If you do not agree, you may not use our services.
        </Text>

        <Title order={2} mt="md" mb="sm">2. Services</Title>
        <Text mb="sm">
          StatusScout is a SaaS platform that provides a complete overview of your website’s security and overall health. It helps you identify security issues and other problems that may negatively impact your website. We may update or modify the services at any time without prior notice.
        </Text>

        <Title order={2} mt="md" mb="sm">3. Accounts</Title>
        <Text mb="sm">
          - You must provide accurate, complete, and up-to-date information when creating an account.<br />
          - You are responsible for maintaining the confidentiality of your account credentials.<br />
          - You are responsible for all activity under your account.
        </Text>

        <Title order={2} mt="md" mb="sm">4. Payment and Billing</Title>
        <Text mb="sm">
          - Access to StatusScout may require payment of subscription fees.<br />
          - Fees are billed monthly or yearly in advance unless otherwise specified.<br />
          - All payments are non-refundable, except as required by law.<br />
          - We reserve the right to change fees at any time with notice.
        </Text>

        <Title order={2} mt="md" mb="sm">5. License and Restrictions</Title>
        <Text mb="sm">
          - We grant you a limited, non-exclusive, non-transferable license to access and use StatusScout for your internal business purposes.<br />
          - You may not:
        </Text>
        <Text mb="sm" ml="lg">
          - Reverse engineer, decompile, or attempt to derive the source code.<br />
          - Use the service to violate any law or third-party rights.<br />
          - Resell or redistribute the service without our express permission.
        </Text>

        <Title order={2} mt="md" mb="sm">6. Intellectual Property</Title>
        <Text mb="sm">
          All content, software, trademarks, and logos provided through StatusScout are our property or licensed to us. Nothing in these Terms grants you ownership rights.
        </Text>

        <Title order={2} mt="md" mb="sm">7. Data and Privacy</Title>
        <Text mb="sm">
          - You retain ownership of the data you upload or generate using StatusScout.<br />
          - We may use aggregated, anonymized data for analytics and service improvement.<br />
          - Please review our Privacy Policy for details on how we collect and use personal data.
        </Text>

        <Title order={2} mt="md" mb="sm">8. Termination</Title>
        <Text mb="sm">
          - We may suspend or terminate your account if you violate these Terms or engage in illegal activity.<br />
          - You may terminate your account at any time through your account settings.<br />
          - Upon termination, your access to StatusScout will cease, and data may be deleted after [X days].
        </Text>

        <Title order={2} mt="md" mb="sm">9. Disclaimer of Warranties</Title>
        <Text mb="sm">
          StatusScout is provided “as is” without warranties of any kind. We do not guarantee uninterrupted or error-free service. You use the service at your own risk.
        </Text>

        <Title order={2} mt="md" mb="sm">10. Limitation of Liability</Title>
        <Text mb="sm">
          To the maximum extent permitted by law, we are not liable for:<br />
          - Indirect, incidental, special, or consequential damages.<br />
          - Loss of data, revenue, or profits arising from your use of StatusScout.<br />
          - Any third-party content or actions.
        </Text>

        <Title order={2} mt="md" mb="sm">11. Indemnification</Title>
        <Text mb="sm">
          You agree to indemnify and hold harmless StatusScout, its affiliates, and employees from claims, damages, or expenses arising from your violation of these Terms or your use of the service.
        </Text>

        <Title order={2} mt="md" mb="sm">12. Governing Law</Title>
        <Text mb="sm">
          These Terms are governed by and construed under the laws of [your jurisdiction], without regard to its conflict of law rules. Any disputes shall be resolved in the courts of [jurisdiction].
        </Text>

        <Title order={2} mt="md" mb="sm">13. Changes to Terms</Title>
        <Text mb="sm">
          We may modify these Terms at any time. Changes will be posted on this page with a new “Last Updated” date. Your continued use constitutes acceptance of the updated Terms.
        </Text>

        <Title order={2} mt="md" mb="sm">14. Contact Us</Title>
        <Text mb="sm">
          If you have questions or concerns about these Terms, please contact us at:<br />
          <b>Email:</b> info@statusscout.dev
        </Text>
      </Container>
    </Layout>
  );
}
