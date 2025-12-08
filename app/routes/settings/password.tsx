import type { Route } from './+types/password'
import { parseWithZod } from '@conform-to/zod'

import { ChangePassword } from '~/components/settings/password-action'
import { SettingRow } from '~/components/settings/setting-row'
import { SettingsLayout } from '~/components/settings/settings-layout'
import { authClient } from '~/lib/auth/auth.client'
import { AppInfo } from '~/lib/config'
import { toast } from '~/lib/utils'
import { changePasswordSchema } from '~/lib/validations/auth'

export const meta: Route.MetaFunction = () => {
  return [{ title: `密码 - ${AppInfo.name}` }]
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
    toast.error(result.error.message || '发生了意外错误。')
    return { status: 'error' }
  }

  toast.success('密码修改成功！其他会话已撤销。')
  return { status: 'success' }
}

export default function ChangePasswordRoute() {
  return (
    <SettingsLayout title="密码">
      <SettingRow
        title="更改您的密码"
        description="如果您已经设置了密码，可以在此处更新。"
        action={<ChangePassword />}
      />
    </SettingsLayout>
  )
}
