import { ArrowLeftIcon } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader } from '~/components/ui/card'

export function AuthLayout({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen w-full items-center justify-center px-4">
      <Button
        variant="ghost"
        size="sm"
        className="fixed top-4 left-4"
        render={<Link to="/" />}
      >
        <ArrowLeftIcon className="size-4" />
        {' '}
        返回首页
      </Button>
      <Card className="mx-auto w-[300px] sm:w-[360px]">
        <CardHeader className="flex flex-col items-center gap-1 text-center">
          <h1 className="font-semibold text-lg">{title}</h1>
          <p className="text-balance text-muted-foreground text-sm">
            {description}
          </p>
        </CardHeader>
        <CardContent>
          {children}
        </CardContent>
      </Card>
    </div>
  )
}
