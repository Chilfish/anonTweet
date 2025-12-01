import type { clientAction } from '~/routes/settings/password'
import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { useEffect, useState } from 'react'

import { useFetcher } from 'react-router'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog'
import { changePasswordSchema } from '~/lib/validations/auth'
import { LoadingButton, PasswordField } from '../forms'

export function ChangePassword() {
  const fetcher = useFetcher<typeof clientAction>({ key: 'change-password' })
  const isPending = fetcher.state !== 'idle'
  const [open, setOpen] = useState(false)

  const [form, fields] = useForm({
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: changePasswordSchema })
    },
    constraint: getZodConstraint(changePasswordSchema),
    shouldRevalidate: 'onInput',
  })

  useEffect(() => {
    if (fetcher.data?.status === 'success') {
      setOpen(false)
    }
  }, [fetcher.data])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        更改密码
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>更改密码</DialogTitle>
          <DialogDescription>
            在这里更改您的密码。您可以更改密码并设置新密码。
          </DialogDescription>
        </DialogHeader>
        <fetcher.Form
          method="post"
          action="." // Ensure action posts to the current route's clientAction
          className="space-y-4"
          {...getFormProps(form)}
        >
          <PasswordField
            labelProps={{ children: '当前密码' }}
            inputProps={{
              ...getInputProps(fields.currentPassword, { type: 'password' }),
              autoComplete: 'current-password',
              enterKeyHint: 'next',
            }}
            errors={fields.currentPassword.errors}
          />
          <PasswordField
            labelProps={{ children: '新密码' }}
            inputProps={{
              ...getInputProps(fields.newPassword, { type: 'password' }),
              autoComplete: 'new-password',
              enterKeyHint: 'next',
            }}
            errors={fields.newPassword.errors}
          />
          <PasswordField
            labelProps={{ children: '确认新密码' }}
            inputProps={{
              ...getInputProps(fields.confirmPassword, { type: 'password' }),
              autoComplete: 'confirm-password',
              enterKeyHint: 'done',
            }}
            errors={fields.confirmPassword.errors}
          />
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" disabled={isPending} />}>

              取消
            </DialogClose>
            <LoadingButton
              buttonText="保存更改"
              loadingText="保存中..."
              isPending={isPending}
            />
          </DialogFooter>
        </fetcher.Form>
      </DialogContent>
    </Dialog>
  )
}
