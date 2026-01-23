import type { VariantProps } from 'class-variance-authority'
import { cva } from 'class-variance-authority'
import { forwardRef, useCallback, useEffect, useRef, useState } from 'react'
import { Skeleton } from '~/components/ui/skeleton'
import { cn } from '~/lib/utils'

// --- Types & Constants ---

type MediaStatus = 'loading' | 'error' | 'success'

// --- 1. Media Loading (Primitive) ---

const mediaLoadingVariants = cva(
  'absolute inset-0 z-10 flex size-full items-center justify-center bg-secondary/50',
)

interface MediaLoadingProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof mediaLoadingVariants> {}

const MediaLoading = forwardRef<HTMLDivElement, MediaLoadingProps>(
  ({ className, children, ...props }, ref) => {
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

const MediaFallback = forwardRef<HTMLDivElement, MediaFallbackProps>(
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

const mediaContainerVariants = cva('relative overflow-hidden', {
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
  loadingFallback?: React.ReactNode
  errorFallback?: React.ReactNode
  containerClassName?: string
}

const MediaImage = forwardRef<HTMLImageElement, MediaImageProps>(
  ({ className, containerClassName, loadingFallback, errorFallback, onLoad, onError, ...props }, ref) => {
    const [status, setStatus] = useState<MediaStatus>('loading')
    const imgRef = useRef<HTMLImageElement>(null)

    const handleLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      setStatus('success')
      onLoad?.(e)
    }, [onLoad])

    const handleError = useCallback((e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      setStatus('error')
      onError?.(e)
    }, [onError])

    const mergedRef = useCallback((node: HTMLImageElement | null) => {
      imgRef.current = node
      if (typeof ref === 'function') {
        ref(node)
      }
      else if (ref) {
        ref.current = node
      }
    }, [ref])

    useEffect(() => {
      if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
        setStatus('success')
      }
    }, [])

    const isLoading = status === 'loading'
    const isError = status === 'error'
    const isSuccess = status === 'success'

    return (
      <div className={cn(
        mediaContainerVariants({ isLoaded: isSuccess }),
        containerClassName,
        'w-full h-full',
      )}
      >
        <img
          ref={mergedRef}
          onLoad={handleLoad}
          onError={handleError}
          data-status={status}
          loading="lazy"
          className={cn(
            'size-full object-cover transition-opacity duration-300',
            isSuccess ? 'opacity-100' : 'opacity-0',
            className,
          )}
          {...props}
        />

        {isLoading && (loadingFallback ?? <MediaLoading />)}
        {isError && (errorFallback ?? <MediaFallback />)}
      </div>
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

const MediaVideo = forwardRef<HTMLVideoElement, MediaVideoProps>(
  ({
    className,
    containerClassName,
    loadingFallback,
    errorFallback,
    onLoadedData,
    onError,
    preload = 'metadata',
    ...props
  }, ref) => {
    const [status, setStatus] = useState<MediaStatus>('loading')
    const videoRef = useRef<HTMLVideoElement>(null)

    const handleLoadedData = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
      setStatus('success')
      onLoadedData?.(e)
    }

    const handleError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
      setStatus('error')
      onError?.(e)
    }

    const mergedRef = (node: HTMLVideoElement | null) => {
      videoRef.current = node
      if (typeof ref === 'function') {
        ref(node)
      }
      else if (ref) {
        ref.current = node
      }
    }

    // 客户端检查视频是否已加载
    useEffect(() => {
      const video = videoRef.current
      if (video && video.readyState >= 2) { // HAVE_CURRENT_DATA
        setStatus('success')
      }
    }, [])

    const isLoading = status === 'loading' && preload !== 'none'
    const isError = status === 'error'
    const isSuccess = status === 'success'

    return (
      <div
        className={cn(
          mediaContainerVariants({ isLoaded: isSuccess }),
          'w-full h-full',
          containerClassName,
        )}
        data-status={status}
      >
        <video
          ref={mergedRef}
          onLoadedData={handleLoadedData}
          onError={handleError}
          data-status={status}
          preload={preload}
          className={cn(
            'size-full object-cover transition-opacity duration-300',
            isSuccess ? 'opacity-100' : 'opacity-0',
            className,
          )}
          {...props}
        />

        {isLoading && (loadingFallback ?? <MediaLoading />)}
        {isError && (errorFallback ?? <MediaFallback />)}
      </div>
    )
  },
)
MediaVideo.displayName = 'MediaVideo'

export { MediaFallback, MediaImage, MediaLoading, MediaVideo }
