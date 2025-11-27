import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '~/components/ui/button'

export function BackButton() {
  return (
    <Button
      className="flex items-center gap-1 mr-auto"
      render={<Link to="/" />}
      variant="link"
    >
      <ArrowLeft className="h-4 w-4" />
      返回
    </Button>
  )
}
