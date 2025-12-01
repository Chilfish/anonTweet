import type { Route } from './+types/sign-up'
import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { Form, Link, redirect } from 'react-router'

import { toast } from 'sonner'
import { AuthLayout } from '~/components/auth-layout'
import { InputField, LoadingButton, PasswordField } from '~/components/forms'
import { useIsPending } from '~/hooks/use-is-pending'
import { authClient } from '~/lib/auth/auth.client'
import { AppInfo } from '~/lib/config'
import { signUpSchema } from '~/lib/validations/auth'

export const meta: Route.MetaFunction = () => {
  return [{ title: `注册 - ${AppInfo.name}` }]
}

export async function clientAction({ request }: Route.ClientActionArgs) {
  const formData = await request.formData()
  const submission = parseWithZod(formData, { schema: signUpSchema })

  if (submission.status !== 'success') {
    return submission.reply()
  }

  const { error } = await authClient.signUp.email({
    callbackURL: '/',
    email: `${submission.value.name}@${AppInfo.domain}`,
    name: submission.value.name,
    password: submission.value.password,
  })

  if (error) {
    return toast.error(error.message || '发生未知错误。')
  }

  // toast.success('注册成功！请检查您的电子邮件以获取验证链接。')
  return redirect('/auth/sign-in')
}

export default function SignUpRoute() {
  const [form, fields] = useForm({
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: signUpSchema })
    },
    constraint: getZodConstraint(signUpSchema),
    shouldRevalidate: 'onInput',
  })

  const isPending = useIsPending({
    formMethod: 'POST',
  })

  return (
    <AuthLayout
      title="创建您的账户"
      description="欢迎！请填写以下详细信息以开始。"
    >
      {/* 注册表单 */}
      <Form method="post" className="grid gap-4" {...getFormProps(form)}>
        <InputField
          labelProps={{ children: '用户名' }}
          inputProps={{
            ...getInputProps(fields.name, { type: 'text' }),
            placeholder: 'Anon Chihaya',
            autoComplete: 'name',
            enterKeyHint: 'next',
            required: true,
          }}
          errors={fields.name.errors}
        />
        <PasswordField
          labelProps={{ children: '密码' }}
          inputProps={{
            ...getInputProps(fields.password, { type: 'password' }),
            placeholder: '请输入一个唯一的密码',
            autoComplete: 'password',
            enterKeyHint: 'done',
          }}
          errors={fields.password.errors}
        />
        <LoadingButton
          buttonText="注册"
          loadingText="正在注册..."
          isPending={isPending}
        />
      </Form>

      {/* 服务条款 */}
      <div className="text-balance text-center text-muted-foreground text-xs my-3">
        点击继续，即表示您同意我们的
        {' '}
        <a href="#" className="text-primary hover:underline">
          服务条款
        </a>
        {' 和 '}
        <a href="#" className="text-primary hover:underline">
          隐私政策
        </a>
        。
      </div>

      {/* 登录 */}
      <div className="text-center text-sm">
        已经有账户了？
        {' '}
        <Link to="/auth/sign-in" className="text-primary hover:underline">
          登录
        </Link>
      </div>
    </AuthLayout>
  )
}
