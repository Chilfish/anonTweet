import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  BellIcon,
  ChevronRight,
  GlobeIcon,
  LogOutIcon,
  MailIcon,
  MoonIcon,
  ShieldIcon,
  SmartphoneIcon,
  UserIcon,
} from 'lucide-react'
import { SettingsGroup, SettingsRow as SettingsItem } from '~/components/settings/SettingsUI'
import { Input } from '~/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Switch } from '~/components/ui/switch'

const meta = {
  title: 'UI/SettingsLayout',
  component: SettingsGroup,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SettingsGroup>

export default meta

type Story = StoryObj<typeof SettingsGroup>

// --- Scenario A: Boolean Toggle ---
export const BooleanToggle: Story = {
  render: () => (
    <div className="w-[400px]">
      <SettingsGroup title="Notifications">
        <SettingsItem
          label="Push Notifications"
          description="Receive updates on your mobile device."
          icon={<BellIcon />}
          id="push-notifications"
        >
          <Switch defaultChecked />
        </SettingsItem>
        <SettingsItem
          label="Email Digest"
          description="Daily summary of activity."
          icon={<MailIcon />}
          id="email-digest"
        >
          <Switch />
        </SettingsItem>
      </SettingsGroup>
    </div>
  ),
}

// --- Scenario B: Navigation / Drill-down ---
export const Navigation: Story = {
  render: () => (
    <div className="w-[400px]">
      <SettingsGroup title="Account">
        <SettingsItem
          label="Security"
          icon={<ShieldIcon />}
          onClick={() => console.log('Navigate to Security')}
        >
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="text-sm">Enabled</span>
            <ChevronRight className="size-4 opacity-50" />
          </div>
        </SettingsItem>
        <SettingsItem
          label="Language"
          icon={<GlobeIcon />}
          onClick={() => console.log('Navigate to Language')}
        >
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="text-sm">English</span>
            <ChevronRight className="size-4 opacity-50" />
          </div>
        </SettingsItem>
      </SettingsGroup>
    </div>
  ),
}

// --- Scenario C: Inline Editing ---
export const InlineEditing: Story = {
  render: () => (
    <div className="w-[400px]">
      <SettingsGroup title="Profile">
        <SettingsItem label="Display Name" icon={<UserIcon />} id="display-name">
          <Input
            className="h-8 w-[200px] border-none bg-transparent px-0 text-right shadow-none focus-visible:ring-0"
            defaultValue="Alice"
          />
        </SettingsItem>
        <SettingsItem label="Email" icon={<MailIcon />} id="email">
          <Input
            className="h-8 w-[200px] border-none bg-transparent px-0 text-right shadow-none focus-visible:ring-0"
            defaultValue="alice@example.com"
          />
        </SettingsItem>
      </SettingsGroup>
    </div>
  ),
}

// --- Scenario D: Destructive Action ---
export const DestructiveAction: Story = {
  render: () => (
    <div className="w-[400px]">
      <SettingsGroup>
        <SettingsItem
          label="Sign Out"
          icon={<LogOutIcon />}
          onClick={() => console.log('Sign Out')}
        />
        <SettingsItem
          label="Delete Account"
          destructive
          className="justify-center font-medium text-center"
          onClick={() => console.log('Delete Account')}
        />
      </SettingsGroup>
    </div>
  ),
}

// --- Complete Example ---
export const CompletePage: Story = {
  render: () => (
    <div className="w-[400px] space-y-6">
      <SettingsGroup title="Appearance">
        <SettingsItem
          label="Theme"
          id="theme"
          icon={<MoonIcon />}
        >
          <Select defaultValue="system">
            <SelectTrigger className="w-[140px] h-8 border-none shadow-none bg-transparent focus:ring-0 justify-end px-0 gap-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </SettingsItem>
      </SettingsGroup>

      <SettingsGroup title="Notifications">
        <SettingsItem
          label="Push Notifications"
          id="push-notifications"
          description="Receive updates on your mobile device."
          icon={<SmartphoneIcon />}
        >
          <Switch defaultChecked />
        </SettingsItem>
        <SettingsItem
          label="Email Digest"
          id="email-digest"
          description="Daily summary of activity."
          icon={<MailIcon />}
        >
          <Switch />
        </SettingsItem>
      </SettingsGroup>

      <SettingsGroup title="Account">
        <SettingsItem
          label="Display Name"
          id="account-name"
          icon={<UserIcon />}
        >
          <Input
            className="h-8 w-[150px] border-none bg-transparent px-0 text-right shadow-none focus-visible:ring-0"
            defaultValue="Alice"
          />
        </SettingsItem>
        <SettingsItem
          label="Security"
          icon={<ShieldIcon />}
          onClick={() => console.log('Navigate to Security')}
        >
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="text-sm">High</span>
            <ChevronRight className="size-4 opacity-50" />
          </div>
        </SettingsItem>
      </SettingsGroup>

      <SettingsGroup>
        <SettingsItem
          label="Log Out"
          icon={<LogOutIcon />}
          destructive
          onClick={() => console.log('Log Out')}
        />
      </SettingsGroup>
    </div>
  ),
}
