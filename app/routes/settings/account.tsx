import type { Route } from './+types/account'
import { parseWithZod } from '@conform-to/zod'

import { dataWithError, dataWithSuccess } from 'remix-toast'
import AvatarCropper from '~/components/avatar-cropper'
import { SignOut } from '~/components/settings/account-action'
import { SettingRow } from '~/components/settings/setting-row'
import { SettingsLayout } from '~/components/settings/settings-layout'
import { useAuthUser } from '~/hooks/use-auth-user'
import { deleteUserImageFromR2, serverAuth } from '~/lib/auth/auth.server'
import { AppInfo } from '~/lib/config'
import { s3Client } from '~/lib/s3Storage'
import { getAvatarUrl } from '~/lib/utils'
import { accountSchema } from '~/lib/validations/settings'
import { requireUser } from '~/middlewares/auth-guard'

export const meta: Route.MetaFunction = () => {
  return [{ title: `账户 - ${AppInfo.name}` }]
}

export async function action({ request, context }: Route.ActionArgs) {
  try {
    const formData = await request.clone().formData()
    const submission = parseWithZod(formData, { schema: accountSchema })

    if (submission.status !== 'success') {
      return dataWithError(null, '无效的表单数据。')
    }

    const headers = request.headers
    const { user } = requireUser()
    const { intent } = submission.value
    let message = ''

    switch (intent) {
      case 'delete-account':
        if (user.role === 'admin') {
          return dataWithError(null, '管理员帐户无法删除。')
        }

        await Promise.all([
          serverAuth.api.revokeSessions({ headers }),
          serverAuth.api.deleteUser({ body: {}, asResponse: false, headers }),
        ])
        message = '帐户已删除。'
        break

      case 'delete-avatar': {
        if (!user.image) {
          return dataWithError(null, '没有要删除的头像。')
        }

        await Promise.all([
          deleteUserImageFromR2(user.image),
          serverAuth.api.updateUser({
            // @ts-expect-error - null is valid for image
            body: { image: null },
            asResponse: false,
            headers,
          }),
        ])
        message = '头像已删除。'
        break
      }

      case 'set-avatar': {
        const image = submission.value.image
        const fileExtension = image.type.split('/')[1]
        const objectName = `user-avatar/${user.id}.${fileExtension}`
        const timestamp = Date.now()
        const imagePath = `${objectName}?v=${timestamp}` // add timestamp to avoid cache
        const imageBuffer = await image.arrayBuffer()

        await Promise.all([
          s3Client.uploadFile(
            objectName,
            new Uint8Array(imageBuffer),
            image.type,
          ),
          serverAuth.api.updateUser({
            body: { image: imagePath },
            asResponse: true,
            headers,
          }),
        ])
        message = '头像已更新。'
        break
      }

      default:
        return dataWithError(null, '无效的意图。')
    }

    return dataWithSuccess(null, message)
  }
  catch (error) {
    console.error('帐户操作错误:', error)
    return dataWithError(null, '发生了意外错误。')
  }
}

export default function AccountRoute() {
  const { user } = useAuthUser()
  const { avatarUrl, placeholderUrl } = getAvatarUrl(user.image, user.name)

  return (
    <SettingsLayout title="帐户">
      <SettingRow
        title="头像"
        description="点击头像更改个人资料图片。"
        action={(
          <AvatarCropper
            avatarUrl={avatarUrl}
            placeholderUrl={placeholderUrl}
          />
        )}
      />
      <SettingRow
        title="当前登录"
        description={`您已登录为 @${user.name}`}
        action={<SignOut />}
      />
      {/* <SettingRow
        title="删除帐户"
        description="永久删除您的帐户。"
        action={<DeleteAccount email={user.email} />}
      /> */}
    </SettingsLayout>
  )
}
