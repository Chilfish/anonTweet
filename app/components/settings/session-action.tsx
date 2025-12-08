import type { clientAction } from '~/routes/settings/sessions'
import { CircleAlertIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

import { useFetcher } from 'react-router'
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '~/components/ui/alert-dialog'
import { Button } from '~/components/ui/button'
import { LoadingButton } from '../forms'

export function SignOutOfOtherSessions() {
  const fetcher = useFetcher<typeof clientAction>({
    key: 'sign-out-of-other-sessions',
  })
  const isPending = fetcher.state !== 'idle'
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (fetcher.data?.status === 'success') {
      setOpen(false)
    }
  }, [fetcher.data])

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={<Button variant="outline" />}>
        退出其他会话
      </AlertDialogTrigger>
      <AlertDialogContent className="sm:max-w-md">
        <div className="flex flex-col gap-2 max-sm:items-center sm:flex-row sm:gap-4">
          <div
            className="flex size-9 shrink-0 items-center justify-center rounded-full border"
            aria-hidden="true"
          >
            <CircleAlertIcon className="opacity-80" size={16} />
          </div>
          <AlertDialogHeader>
            <AlertDialogTitle>您确定吗？</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要退出其他会话吗？ 这将退出除当前会话之外的所有会话。
            </AlertDialogDescription>
          </AlertDialogHeader>
        </div>
        <fetcher.Form method="post" action=".">
          <AlertDialogFooter>
            <AlertDialogClose disabled={isPending}>
              取消
            </AlertDialogClose>
            <LoadingButton
              buttonText="退出"
              loadingText="退出中..."
              isPending={isPending}
            />
          </AlertDialogFooter>
        </fetcher.Form>
      </AlertDialogContent>
    </AlertDialog>
  )
}
