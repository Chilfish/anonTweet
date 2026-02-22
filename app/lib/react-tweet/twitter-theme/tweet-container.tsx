import type { ReactNode, Ref } from 'react'
import { cn } from '~/lib/utils'

interface TweetContainerProps {
  children: ReactNode
  className?: string
  id?: string
  ref?: Ref<HTMLDivElement>
}

export function TweetContainer({ className, children, ref, id }: TweetContainerProps) {
  return (
    <div
      id={id}
      className={cn('tweet-container', className)}
      ref={ref}
    >
      <article className="relative box-inherit">{children}</article>
    </div>
  )
}
