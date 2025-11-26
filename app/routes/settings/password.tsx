import type { Route } from './+types/password'
import { parseWithZod } from '@conform-to/zod'

import { toast } from 'sonner'
import { ChangePassword } from '~/components/settings/password-action'
import { SettingRow } from '~/components/settings/setting-row'
import { SettingsLayout } from '~/components/settings/settings-layout'
import { authClient } from '~/lib/auth/auth.client'
import { AppInfo } from '~/lib/config'
import { changePasswordSchema } from '~/lib/validations/auth'

export const meta: Route.MetaFunction = () => {
  return [{ title: `Password - ${AppInfo.name}` }]
}

export async function clientAction({ request }: Route.ClientActionArgs) {
  const formData = await request.formData()
  const submission = parseWithZod(formData, { schema: changePasswordSchema })

  if (submission.status !== 'success') {
    return submission.reply()
  }

  const result = await authClient.changePassword({
    newPassword: submission.value.newPassword,
    currentPassword: submission.value.currentPassword,
    revokeOtherSessions: true,
  })

  if (result.error) {
    toast.error(result.error.message || 'An unexpected error occurred.')
    return { status: 'error' }
  }

  toast.success('Password changed successfully! Other sessions revoked.')
  return { status: 'success' }
}

export default function ChangePasswordRoute() {
  return (
    <SettingsLayout title="Password">
      <SettingRow
        title="Change your password"
        description="If you have already set your password, you can update it here. If you have forgotten your password, please reset it below."
        action={<ChangePassword />}
      />
    </SettingsLayout>
  )
}
