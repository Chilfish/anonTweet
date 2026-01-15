import type { VariantProps } from 'class-variance-authority'
import type { LucideIcon } from 'lucide-react'
import { cva } from 'class-variance-authority'
import React from 'react'

import { Label } from '~/components/ui/label'
import { cn } from '~/lib/utils'

// --- Settings Group ---

const settingsGroupVariants = cva(
  'w-full overflow-hidden rounded-xl border bg-card text-card-foreground shadow-xs',
  {
    variants: {
      variant: {
        default: '',
        ghost: 'border-none shadow-none bg-transparent',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

interface SettingsGroupProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof settingsGroupVariants> {
  title?: string
  description?: string
}

const SettingsGroup = React.forwardRef<HTMLDivElement, SettingsGroupProps>(
  ({ className, variant, title, description, children, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-2">
        {(title || description) && (
          <div className="px-4 pb-1">
            {title && (
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-xs text-muted-foreground/70 mt-1">
                {description}
              </p>
            )}
          </div>
        )}
        <div
          ref={ref}
          className={cn(settingsGroupVariants({ variant, className }))}
          {...props}
        >
          {children}
        </div>
      </div>
    )
  },
)
SettingsGroup.displayName = 'SettingsGroup'

// --- Settings Item ---

const settingsItemVariants = cva(
  'relative flex min-h-14 w-full items-center justify-between gap-4 px-4 py-3 transition-colors outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&:not(:last-child)]:border-b',
  {
    variants: {
      variant: {
        default: 'bg-card hover:bg-accent/50',
        destructive: 'bg-card hover:bg-destructive/10 text-destructive',
      },
      interactive: {
        true: 'cursor-pointer active:bg-accent/80',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      interactive: false,
    },
  },
)

interface SettingsItemProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof settingsItemVariants> {
  label: React.ReactNode
  description?: React.ReactNode
  icon?: React.ReactElement<React.ComponentProps<LucideIcon>>
  destructive?: boolean
  disabled?: boolean
  asChild?: boolean
  id?: string
}

const SettingsItem = React.forwardRef<HTMLDivElement, SettingsItemProps>(
  (
    {
      className,
      variant,
      label,
      description,
      icon,
      children,
      destructive,
      disabled,
      onClick,
      id,
      ...props
    },
    ref,
  ) => {
    const isInteractive = !!onClick || !!props.role || props.role === 'button' || props.role === 'link'

    return (
      <div
        ref={ref}
        className={cn(
          settingsItemVariants({
            variant: destructive ? 'destructive' : variant,
            interactive: isInteractive,
            className,
          }),
        )}
        onClick={!disabled ? onClick : undefined}
        data-disabled={disabled}
        aria-disabled={disabled}
        {...props}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {icon && (
            <div
              className={cn(
                'flex items-center justify-center text-muted-foreground/80',
                destructive && 'text-destructive/80',
              )}
            >
              {React.cloneElement(icon as React.ReactElement<any>, {
                className: cn('size-5', icon.props.className),
              })}
            </div>
          )}
          <div className="flex flex-col gap-0.5 min-w-0">
            <Label
              htmlFor={id}
              className={cn(
                'text-sm font-medium leading-none wrap-break-word cursor-pointer',
                destructive && 'text-destructive',
              )}
            >
              {label}
            </Label>
            {description && (
              <span className="text-xs text-muted-foreground wrap-break-word leading-relaxed">
                {description}
              </span>
            )}
          </div>
        </div>
        {children && React.isValidElement(children) && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {React.cloneElement(children, { id } as React.Attributes)}
          </div>
        )}
      </div>
    )
  },
)

export { SettingsGroup, SettingsItem as SettingsRow }
