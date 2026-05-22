import { Popover, Text, ThemeIcon } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks';
import { IconInfoSmall } from '@tabler/icons-react'

const InfoPopover = ({ infoText, children, width = 300 }) => {
  const [opened, { close, open }] = useDisclosure(false);

  return <Popover width={width} position="bottom" withArrow shadow="md" opened={opened}>
    <Popover.Target>
      <ThemeIcon
        variant="outline"
        radius="xl"
        size="14px"
        style={{ cursor: 'pointer' }}
        onMouseEnter={open}
        onMouseLeave={close}
        onClick={() => {
          if (opened) close();
          else open();
        }}
      >
        <IconInfoSmall width="100%" height="100%" />
      </ThemeIcon>
    </Popover.Target>
    <Popover.Dropdown>
      {children ?? <Text size="sm">{infoText}</Text>}
    </Popover.Dropdown>
  </Popover>
}

export default InfoPopover
