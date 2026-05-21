import { Flex, RingProgress, Center, Text, Loader, Box } from '@mantine/core';
import { IconCheck, IconX } from '@tabler/icons-react';

const sizes = {
  md: { ring: 80, text: 'sm', thickness: 8 },
  lg: { ring: 120, text: 'lg', thickness: 12 },
};

export const LoadingChart = ({ size = 'md', label, checkState, showLabel = true }) => {
  const s = {
    md: { ring: 64, padding: 8, text: 'sm' },
    lg: { ring: 96, padding: 12, text: 'lg' },
  }[size]

  if (checkState === 'failed' || checkState === 'completed') {
    return (
      <Flex direction="column" align="center">
        <RingProgress
          size={(sizes[size] || sizes.md).ring}
          roundCaps
          thickness={(sizes[size] || sizes.md).thickness}
          sections={[{ value: 100, color: 'grey' }]}
          label={
            <Center>
              <IconX size={30} stroke={2} color="grey" />
            </Center>
          }
        />
        {showLabel && <Text size={s.text}>{label}</Text>}
      </Flex>
    );
  }

  return (
    <Flex direction="column" align="center">
      <Box p={s.padding} pb="0">
        <Loader size={s.ring} />
      </Box>
      {showLabel && <Text size={s.text}>{label}</Text>}
    </Flex>
  );
}

export function SSLChart({ status, size = 'md', showLabel = true }) {
  const s = sizes[size] || sizes.md;
  return (
    <Flex direction="column" align="center">
      <RingProgress
        size={s.ring}
        roundCaps
        thickness={s.thickness}
        sections={[{ value: 100, color: status === 'success' ? 'green' : 'red' }]}
        label={
          <Center>
            {status === 'success' && <IconCheck size={s.icon} stroke={3} color="green" />}
            {status !== 'success' && <IconX size={s.icon} stroke={3} color="red" />}
          </Center>
        }
      />
      {showLabel && <Text size={s.text}>SSL Certificate</Text>}
    </Flex>
  );
}

export function HeaderChart({ status, missingHeaders, size = 'md', showLabel = true }) {
  const s = sizes[size] || sizes.md;
  const isAllGood = missingHeaders.length === 0;
  return (
    <Flex direction="column" align="center">
      <RingProgress
        size={s.ring}
        roundCaps
        thickness={s.thickness}
        sections={[{ value: 100, color: isAllGood ? 'green' : 'yellow' }]}
        label={
          <Center>
            {isAllGood && <IconCheck size={s.icon} stroke={3} color="green" />}
            {!isAllGood && <Text c="yellow" fw="bold" size={s.text}>{missingHeaders.length}</Text>}
          </Center>
        }
      />
      {showLabel && <Text size={s.text}>Security Headers</Text>}
    </Flex>
  );
}

export function HeaderWarningsChart({ details, size = 'md', showLabel = true }) {
  const s = sizes[size] || sizes.md;
  const warningCount =
    (details?.versionDisclosure?.length || 0) +
    (details?.httpsRedirect && !details.httpsRedirect.redirects && !details.httpsRedirect.connectionFailed ? 1 : 0) +
    (details?.corsWildcard ? 1 : 0);
  return (
    <Flex direction="column" align="center">
      <RingProgress
        size={s.ring}
        roundCaps
        thickness={s.thickness}
        sections={[{ value: 100, color: warningCount === 0 ? 'green' : 'yellow' }]}
        label={
          <Center>
            {warningCount === 0 && <IconCheck size={s.icon} stroke={3} color="green" />}
            {warningCount > 0 && <Text c="yellow" fw="bold" size={s.text}>{warningCount}</Text>}
          </Center>
        }
      />
      {showLabel && <Text size={s.text}>Header Warnings</Text>}
    </Flex>
  );
}

export function DnsChart({ status, details, size = 'md', showLabel = true }) {
  const s = sizes[size] || sizes.md;
  const failedDns = details ? Object.values(details).filter(d => !d.success) : [];

  return (
    <Flex direction="column" align="center">
      <RingProgress
        size={s.ring}
        roundCaps
        thickness={s.thickness}
        sections={[{ value: 100, color: failedDns.length === 0 ? 'green' : 'yellow' }]}
        label={
          <Center>
            {failedDns.length === 0 && <IconCheck size={s.icon} stroke={3} color="green" />}
            {failedDns.length > 0 && <Text c="yellow" fw="bold" size={s.text}>{failedDns.length}</Text>}
          </Center>
        }
      />
      {showLabel && <Text size={s.text}>DNS Records</Text>}
    </Flex>
  );
}

export function FuzzChart({ status, files, size = 'md', showLabel = true }) {
  const s = sizes[size] || sizes.md;
  return (
    <Flex direction="column" align="center">
      <RingProgress
        size={s.ring}
        roundCaps
        thickness={s.thickness}
        sections={[{ value: 100, color: files.length === 0 ? 'green' : 'yellow' }]}
        label={
          <Center>
            {files.length === 0 && <IconCheck size={s.icon} stroke={3} color="green" />}
            {files.length > 0 && <Text c="yellow" fw="bold" size={s.text}>{files.length}</Text>}
          </Center>
        }
      />
      {showLabel && <Text size={s.text}>Sensitive Files</Text>}
    </Flex>
  );
}

export function PageAnalysisChart({ details, size = 'md', showLabel = true }) {
  const s = sizes[size] || sizes.md;
  const issueCount =
    (details?.verboseErrors ? 1 : 0) +
    (details?.sriIssues?.length || 0) +
    (details?.csrfIssues?.length || 0) +
    (details?.dirListingIssues?.length || 0);
  return (
    <Flex direction="column" align="center">
      <RingProgress
        size={s.ring}
        roundCaps
        thickness={s.thickness}
        sections={[{ value: 100, color: issueCount === 0 ? 'green' : 'yellow' }]}
        label={
          <Center>
            {issueCount === 0 && <IconCheck size={s.icon} stroke={3} color="green" />}
            {issueCount > 0 && <Text c="yellow" fw="bold" size={s.text}>{issueCount}</Text>}
          </Center>
        }
      />
      {showLabel && <Text size={s.text}>Page Security</Text>}
    </Flex>
  );
}

export function ApiDocsChart({ status, exposed, size = 'md', showLabel = true }) {
  const s = sizes[size] || sizes.md;
  return (
    <Flex direction="column" align="center">
      <RingProgress
        size={s.ring}
        roundCaps
        thickness={s.thickness}
        sections={[{ value: 100, color: exposed.length === 0 ? 'green' : 'red' }]}
        label={
          <Center>
            {exposed.length === 0 && <IconCheck size={s.icon} stroke={3} color="green" />}
            {exposed.length > 0 && <Text c="red" fw="bold" size={s.text}>{exposed.length}</Text>}
          </Center>
        }
      />
      {showLabel && <Text size={s.text}>Exposed APIs</Text>}
    </Flex>
  );
}

export function CookiesChart({ status, issues, size = 'md', showLabel = true }) {
  const s = sizes[size] || sizes.md;
  return (
    <Flex direction="column" align="center">
      <RingProgress
        size={s.ring}
        roundCaps
        thickness={s.thickness}
        sections={[{ value: 100, color: issues.length === 0 ? 'green' : 'yellow' }]}
        label={
          <Center>
            {issues.length === 0 && <IconCheck size={s.icon} stroke={3} color="green" />}
            {issues.length > 0 && <Text c="yellow" fw="bold" size={s.text}>{issues.length}</Text>}
          </Center>
        }
      />
      {showLabel && <Text size={s.text}>Cookie Security</Text>}
    </Flex>
  );
}

export function MixedContentChart({ status, issues, size = 'md', showLabel = true }) {
  const s = sizes[size] || sizes.md;
  return (
    <Flex direction="column" align="center">
      <RingProgress
        size={s.ring}
        roundCaps
        thickness={s.thickness}
        sections={[{ value: 100, color: issues.length === 0 ? 'green' : 'yellow' }]}
        label={
          <Center>
            {issues.length === 0 && <IconCheck size={s.icon} stroke={3} color="green" />}
            {issues.length > 0 && <Text c="yellow" fw="bold" size={s.text}>{issues.length}</Text>}
          </Center>
        }
      />
      {showLabel && <Text size={s.text}>Mixed Content</Text>}
    </Flex>
  );
}

export function CustomFlowsChart({ checks, customFlowLength, size = 'md', showLabel = true }) {
  const s = sizes[size] || sizes.md;
  const passed = checks.filter(c => c?.result?.status === 'success').length;
  const allPassed = customFlowLength > 0 && passed === customFlowLength;
  return (
    <Flex direction="column" align="center">
      <RingProgress
        size={s.ring}
        roundCaps
        thickness={s.thickness}
        sections={customFlowLength === 0
          ? [{ value: 100, color: 'gray' }]
          : [
              { value: (passed / customFlowLength) * 100, color: 'green' },
              { value: ((customFlowLength - passed) / customFlowLength) * 100, color: 'red' },
            ].filter(s => s.value > 0)
        }
        label={
          <Center>
            {customFlowLength === 0 && <Text c="dimmed" fw="bold" size={s.text}>—</Text>}
            {customFlowLength > 0 && allPassed && <IconCheck size={s.icon} stroke={3} color="green" />}
            {customFlowLength > 0 && !allPassed && <Text fw="bold" size={s.text}>{passed} / {customFlowLength}</Text>}
          </Center>
        }
      />
      {showLabel && <Text size={s.text}>Custom Flows</Text>}
    </Flex>
  );
}
