import type { Route } from './+types/sign-in'
import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { useEffect, useState } from 'react'
import { Form, Link, redirect, useNavigation } from 'react-router'
import { AuthLayout } from '~/components/auth-layout'
import { InputField, LoadingButton, PasswordField } from '~/components/forms'
import { authClient } from '~/lib/auth/auth.client'
import { AppInfo } from '~/lib/config'
import { toast } from '~/lib/utils'
import { signInSchema } from '~/lib/validations/auth'

export const meta: Route.MetaFunction = () => {
  return [{ title: `Sign In - ${AppInfo.name}` }]
}

export async function clientAction({ request }: Route.ClientActionArgs) {
  const formData = await request.clone().formData()
  const submission = parseWithZod(formData, { schema: signInSchema })

  if (submission.status !== 'success') {
    return toast.error('Invalid form data.')
  }

  switch (submission.value.provider) {
    case 'sign-in': {
      const { email, password } = submission.value
      const { error } = await authClient.signIn.email({
        email: `${email}@${AppInfo.domain}`,
        password,
      })
      if (error) {
        if (error.code === 'INVALID_EMAIL_OR_PASSWORD') {
          return toast.error('用户名或密码错误')
        }
        return toast.error(error.message || '登录失败')
      }
      break
    }

    default:
      return toast.error('无效的登录方式.')
  }

  return redirect('/')
}

export default function SignInRoute() {
  const [form, fields] = useForm({
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: signInSchema })
    },
    constraint: getZodConstraint(signInSchema),
    shouldRevalidate: 'onInput',
  })

  const navigation = useNavigation()
  const [lastMethod, setLastMethod] = useState<string | null>(null)
  const isPending = (provider: string) =>
    navigation.formData?.get('provider') === provider
    && navigation.state !== 'idle'
  const isSignInPending = isPending('sign-in')

  useEffect(() => {
    const lastMethod = authClient.getLastUsedLoginMethod()
    setLastMethod(lastMethod)
  }, [])
  return (
    <AuthLayout
      title="登录您的账户"
      description="欢迎回来！请登录以继续。"
    >
      {/* 登录表单 */}
      <Form method="post" className="grid gap-4" {...getFormProps(form)}>
        <InputField
          labelProps={{ children: '用户名' }}
          inputProps={{
            ...getInputProps(fields.email, { type: 'text' }),
            placeholder: 'Anon Chihaya',
            autoComplete: 'text',
            enterKeyHint: 'next',
          }}
          errors={fields.email.errors}
        />
        <PasswordField
          labelProps={{
            className: 'flex items-center justify-between',
            children: (
              <>
                <span>密码</span>
              </>
            ),
          }}
          inputProps={{
            ...getInputProps(fields.password, { type: 'password' }),
            placeholder: '••••••••••',
            autoComplete: 'current-password',
            enterKeyHint: 'done',
          }}
          errors={fields.password.errors}
        />
        <input type="hidden" name="provider" value="sign-in" />
        <div className="relative overflow-hidden rounded-lg">
          <LoadingButton
            className="w-full"
            buttonText="登录"
            loadingText="正在登录..."
            isPending={isSignInPending}
          />
          {lastMethod === 'email' && (
            <span className="absolute top-0 right-0 rounded-bl-md bg-blue-400 px-2 py-0.5 text-[10px] text-white capitalize">
              上次使用
            </span>
          )}
        </div>
      </Form>
      {/* 注册 */}
      <div className="text-center text-sm mt-2">
        没有账号吗？
        {' '}
        <Link to="/auth/sign-up" className="text-primary hover:underline">
          点击注册
        </Link>
      </div>
    </AuthLayout>
  )
}
