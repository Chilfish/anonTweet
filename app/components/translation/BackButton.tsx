import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '~/components/ui/button'
import { BiliBiliICon } from '../icons'

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

export function PubToBili() {
  return (
    <Button
      render={<Link to="/bili" />}
      variant="ghost"
      size="icon"
    >
      <BiliBiliICon
        className="size-7"
      />
    </Button>
  )
}
