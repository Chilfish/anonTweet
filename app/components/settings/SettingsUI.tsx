import type * as React from 'react'
import { cn } from '~/lib/utils'

export function SettingsGroup({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={cn('overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm', className)}>
      <div className="flex flex-col">
        {children}
      </div>
    </div>
  )
}

export function SettingsRow({
  children,
  className,
  ...props
}: {
  children: React.ReactNode
  className?: string
} & React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'flex min-h-14 items-center justify-between gap-4 p-4 not-last:border-b bg-card',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
