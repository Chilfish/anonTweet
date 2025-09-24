import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '~/components/ui/button'

export function BackButton() {
  return (
    <Button
      className="flex items-center gap-1 mr-auto"
      asChild
      variant="link"
    >
      <Link
        to="/"
      >
        <ArrowLeft className="h-4 w-4" />
        返回
      </Link>
    </Button>
  )
}
