import type { VariantProps } from 'class-variance-authority'
import { cva } from 'class-variance-authority'
import * as React from 'react'
import { Skeleton } from '~/components/ui/skeleton'
import { cn } from '~/lib/utils'

// --- Types & Constants ---

type MediaStatus = 'loading' | 'error' | 'success'

// --- 1. Media Loading (Primitive) ---

const mediaLoadingVariants = cva(
  'absolute inset-0 z-10 flex size-full items-center justify-center bg-secondary/50',
)

interface MediaLoadingProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof mediaLoadingVariants> {}

const MediaLoading = React.forwardRef<HTMLDivElement, MediaLoadingProps>(
  ({ className, children, ...props }, ref) => {
    // 如果有 children，则渲染自定义内容容器，否则渲染 Skeleton
    if (children) {
      return (
        <div ref={ref} className={cn(mediaLoadingVariants({ className }))} {...props}>
          {children}
        </div>
      )
    }

    return (
      <Skeleton
        ref={ref}
        className={cn('absolute inset-0 size-full', className)}
        {...props}
      />
    )
  },
)
MediaLoading.displayName = 'MediaLoading'

// --- 2. Media Fallback (Primitive) ---

const mediaFallbackVariants = cva(
  'absolute inset-0 z-10 flex size-full items-center justify-center bg-muted text-muted-foreground',
)

interface MediaFallbackProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof mediaFallbackVariants> {}

const MediaFallback = React.forwardRef<HTMLDivElement, MediaFallbackProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(mediaFallbackVariants({ className }))}
        {...props}
      />
    )
  },
)
MediaFallback.displayName = 'MediaFallback'

// --- 3. Media Image (Smart Particle) ---

const mediaContainerVariants = cva('overflow-hidden', {
  variants: {
    isLoaded: {
      true: 'bg-transparent',
      false: 'bg-muted/10',
    },
  },
  defaultVariants: {
    isLoaded: false,
  },
})

export interface MediaImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /**
   * Custom element to show while loading.
   * Defaults to <MediaLoading />
   */
  loadingFallback?: React.ReactNode
  /**
   * Custom element to show on error.
   * Defaults to <MediaFallback />
   */
  errorFallback?: React.ReactNode
  /**
   * Helper to force wrapping div classes
   */
  containerClassName?: string
}

const MediaImage = React.forwardRef<HTMLImageElement, MediaImageProps>(
  ({ className, containerClassName, loadingFallback, errorFallback, onLoad, onError, ...props }, ref) => {
    const [status, setStatus] = React.useState<MediaStatus>('loading')
    const internalRef = React.useRef<HTMLImageElement>(null)

    // Check for cached images immediately to avoid hydration mismatch or flash
    React.useLayoutEffect(() => {
      if (internalRef.current?.complete) {
        setStatus('success')
      }
    }, [])

    const handleLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      setStatus('success')
      onLoad?.(e)
    }

    const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      setStatus('error')
      onError?.(e)
    }

    // Merge refs logic
    const mergedRef = (node: HTMLImageElement) => {
      internalRef.current = node
      if (typeof ref === 'function') {
        ref(node)
      }
      else if (ref) {
        ref.current = node
      }
    }

    // Render Logic
    const showLoading = status === 'loading'
    const showError = status === 'error'
    const showImage = status === 'success' || status === 'loading' // Image stays in DOM to trigger onLoad

    return (
      <>
        {showImage && (
          <img
            ref={mergedRef}
            onLoad={handleLoad}
            onError={handleError}
            data-status={status}
            loading="lazy"
            className={cn(
              mediaContainerVariants({ isLoaded: status === 'success' }),
              containerClassName,
              'size-full object-cover transition-opacity duration-300',
              status === 'loading' ? 'opacity-0' : 'opacity-100',
              className,
            )}
            {...props}
          />
        )}

        {showLoading && (loadingFallback || <MediaLoading />)}
        {showError && (errorFallback || <MediaFallback />)}
      </>
    )
  },
)
MediaImage.displayName = 'MediaImage'

// --- 4. Media Video (Smart Particle) ---

export interface MediaVideoProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  loadingFallback?: React.ReactNode
  errorFallback?: React.ReactNode
  containerClassName?: string
}

const MediaVideo = React.forwardRef<HTMLVideoElement, MediaVideoProps>(
  ({ className, containerClassName, loadingFallback, errorFallback, onLoadedData, onError, ...props }, ref) => {
    const [status, setStatus] = React.useState<MediaStatus>('loading')

    const handleLoadedData = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
      setStatus('success')
      onLoadedData?.(e)
    }

    const handleError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
      setStatus('error')
      onError?.(e)
    }

    const showLoading = status === 'loading'
    const showError = status === 'error'

    // Video is tricky; usually we want it mounted to start buffering
    const showVideo = status !== 'error'

    return (
      <div
        className={cn(mediaContainerVariants({ isLoaded: status === 'success' }), containerClassName)}
        data-status={status}
      >
        {showVideo && (
          <video
            ref={ref}
            onLoadedData={handleLoadedData}
            onError={handleError}
            data-status={status}
            className={cn(
              'size-full object-cover transition-opacity duration-300',
              status === 'loading' ? 'opacity-0' : 'opacity-100',
              className,
            )}
            {...props}
          />
        )}

        {showLoading && (loadingFallback || <MediaLoading />)}
        {showError && (errorFallback || <MediaFallback />)}
      </div>
    )
  },
)
MediaVideo.displayName = 'MediaVideo'

export { MediaFallback, MediaImage, MediaLoading, MediaVideo }
