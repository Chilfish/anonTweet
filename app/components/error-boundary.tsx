import { MehIcon } from 'lucide-react'
import { Link } from 'react-router'
import { buttonVariants } from '~/components/ui/button'

export function ErrorDisplay({
  message,
  detail,
}: {
  message: string
  detail: string
}) {
  return (
    <main className="flex h-screen items-center justify-center p-6">
      <div className="mx-auto flex max-w-sm flex-col items-center gap-4 text-center">
        <div className="rounded-full bg-muted p-3">
          <MehIcon className="size-6" />
        </div>

        <div className="space-y-1">
          <h1 className="font-semibold text-lg">{message}</h1>
          <p className="text-base text-muted-foreground">{detail}</p>
        </div>

        <Link to="/" className={buttonVariants()}>
          返回首页
        </Link>
      </div>
    </main>
  )
}
