import type { PanInfo } from 'framer-motion'
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { cva } from 'class-variance-authority'
import useEmblaCarousel from 'embla-carousel-react'
import { AnimatePresence, motion, useMotionValue, useTransform } from 'framer-motion'
import { ChevronLeftIcon, ChevronRightIcon, XIcon } from 'lucide-react'
import * as React from 'react'
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch'

import { Button } from '~/components/ui/button'
import { cn } from '~/lib/utils'

// --- Types ---

export interface MediaItem {
  id: string
  url: string
  type: 'image' | 'video'
  alt?: string
  width?: number
  height?: number
}

export interface ImagePreviewerProps extends React.HTMLAttributes<HTMLDivElement> {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialIndex?: number
  items: MediaItem[]
  headerStart?: React.ReactNode
  headerEnd?: React.ReactNode
  footerStart?: React.ReactNode
  footerEnd?: React.ReactNode
}

// --- Styles ---

const overlayVariants = cva(
  'fixed inset-0 z-50 flex flex-col justify-between pointer-events-none transition-opacity duration-300',
  {
    variants: {
      visible: {
        true: 'opacity-100',
        false: 'opacity-0',
      },
    },
    defaultVariants: {
      visible: true,
    },
  },
)

const backdropVariants = cva(
  'fixed inset-0 z-50 bg-black/80 backdrop-blur-md',
  {
    variants: {
      state: {
        open: 'animate-in fade-in-0',
        closed: 'animate-out fade-out-0',
      },
    },
  },
)

// --- Reducer State ---

interface PreviewerState {
  currentIndex: number
  canScrollPrev: boolean
  canScrollNext: boolean
}

// --- Logic Hook ---

function usePreviewerLogic({
  initialIndex,
  open,
  onOpenChange,
}: {
  initialIndex: number
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const [previewerState, previewerDispatch] = React.useReducer(
    (prev: PreviewerState, next: Partial<PreviewerState>) => ({ ...prev, ...next }),
    { currentIndex: initialIndex, canScrollPrev: false, canScrollNext: false },
  )

  const [controlsVisible, setControlsVisible] = React.useState(true)
  const [isDragging, setIsDragging] = React.useState(false)
  const [isZoomed, setIsZoomed] = React.useState(false)

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    startIndex: initialIndex,
    duration: 20,
  })

  // Sync State
  React.useEffect(() => {
    if (!emblaApi)
      return
    const updateState = () => {
      previewerDispatch({
        currentIndex: emblaApi.selectedScrollSnap(),
        canScrollPrev: emblaApi.canScrollPrev(),
        canScrollNext: emblaApi.canScrollNext(),
      })
    }
    updateState()
    emblaApi.on('select', updateState)
    emblaApi.on('reInit', updateState)
    return () => {
      emblaApi.off('select', updateState)
      emblaApi.off('reInit', updateState)
    }
  }, [emblaApi])

  // Scroll to initial index when opening
  React.useEffect(() => {
    if (open && emblaApi) {
      requestAnimationFrame(() => emblaApi.scrollTo(initialIndex, true))
    }
  }, [open, initialIndex, emblaApi])

  // Physics & Gestures
  const dragY = useMotionValue(0)
  const bgOpacity = useTransform(dragY, [-200, 0, 200], [0.5, 1, 0.5])
  const scale = useTransform(dragY, [-300, 0, 300], [0.9, 1, 0.9])

  const handleDragEnd = (_: any, info: PanInfo) => {
    setIsDragging(false)
    const offset = Math.abs(info.offset.y)
    const velocity = Math.abs(info.velocity.y)

    if (offset > 200 || velocity > 800) {
      onOpenChange(false)
    }
  }

  const scrollPrev = React.useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = React.useCallback(() => emblaApi?.scrollNext(), [emblaApi])

  React.useEffect(() => {
    if (!open)
      return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft')
        scrollPrev()
      if (e.key === 'ArrowRight')
        scrollNext()
      if (e.key === 'Escape')
        onOpenChange(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, scrollPrev, scrollNext, onOpenChange])

  const toggleControls = React.useCallback(() => {
    if (!isDragging && !isZoomed)
      setControlsVisible(prev => !prev)
  }, [isDragging, isZoomed])

  return {
    currentIndex: previewerState.currentIndex,
    controlsVisible,
    isDragging,
    isZoomed,
    canScrollPrev: previewerState.canScrollPrev,
    canScrollNext: previewerState.canScrollNext,
    setIsDragging,
    setIsZoomed,
    toggleControls,
    scrollPrev,
    scrollNext,
    emblaRef,
    physics: { dragY, bgOpacity, scale, handleDragEnd },
  }
}

// --- Component ---

function ImagePreviewer({
  open,
  onOpenChange,
  initialIndex = 0,
  items,
  headerStart,
  headerEnd,
  footerStart,
  footerEnd,
  className,
  ref,
  ...props
}: ImagePreviewerProps & { ref?: React.Ref<HTMLDivElement> }) {
  const {
    currentIndex,
    controlsVisible,
    isDragging,
    isZoomed,
    canScrollPrev,
    canScrollNext,
    setIsDragging,
    setIsZoomed,
    toggleControls,
    scrollPrev,
    scrollNext,
    emblaRef,
    physics,
  } = usePreviewerLogic({ initialIndex, open, onOpenChange })

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ opacity: physics.bgOpacity }}
              className={backdropVariants()}
              aria-hidden="true"
            />
            <DialogPrimitive.Popup
              ref={ref}
              className={cn('fixed inset-0 z-50 flex items-center justify-center', className)}
              {...props}
            >
              <motion.div
                className="relative size-full flex items-center justify-center"
                initial={{
                  opacity: 0,
                  scale: 0.95,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  scale: 0.95,
                }}
                transition={{
                  type: 'spring',
                  damping: 25,
                  stiffness: 300,
                }}
                style={{
                  scale: physics.scale,
                  y: physics.dragY,
                  touchAction: 'pan-x',
                }}
                drag={isZoomed ? false : 'y'}
                dragDirectionLock
                dragConstraints={{
                  top: 0,
                  bottom: 0,
                }}
                dragElastic={0.2}
                dragTransition={{
                  bounceStiffness: 600,
                  bounceDamping: 30,
                }}
                onDragStart={() => setIsDragging(true)}
                onDragEnd={physics.handleDragEnd}
              >
                <div className="size-full overflow-hidden" ref={emblaRef}>
                  <div className="flex h-full">
                    {items.map(item => (
                      <div
                        key={item.id}
                        className="relative flex min-w-0 flex-[0_0_100%] items-center justify-center"
                      >
                        <TransformWrapper
                          disabled={item.type === 'video'}
                          doubleClick={{ disabled: false, mode: 'reset' }}
                          onZoom={r => setIsZoomed(r.state.scale > 1)}
                          onPanning={r => setIsZoomed(r.state.scale > 1)}
                          alignmentAnimation={{ animationTime: 200 }} // Faster snap back
                        >
                          <TransformComponent
                            wrapperClass="!w-full !h-full flex items-center justify-center"
                            contentClass="!w-full !h-full flex items-center justify-center"
                          >
                            <div
                              className="relative flex items-center justify-center w-full h-full p-0 md:p-8"
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault()
                                  toggleControls()
                                }
                              }}
                              onClick={toggleControls}
                            >
                              {item.type === 'video' ? (
                                <video
                                  src={item.url}
                                  controls
                                  className="max-h-full max-w-full shadow-2xl rounded-sm bg-gray-950"
                                  onClick={e => e.stopPropagation()}
                                />
                              ) : (
                                <img
                                  src={item.url}
                                  alt={item.alt}
                                  className="max-h-[calc(100vh-4rem)] max-w-full object-contain shadow-2xl select-none"
                                  draggable={false}
                                />
                              )}
                            </div>
                          </TransformComponent>
                        </TransformWrapper>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              <div
                className={overlayVariants({ visible: controlsVisible })}
                data-state={controlsVisible ? 'visible' : 'hidden'}
              >
                {/* Header */}
                <div className="w-full p-4 flex justify-between items-start bg-gradient-to-b from-black/60 to-transparent pt-safe-top">
                  <div className="pointer-events-auto flex items-center gap-3">
                    {headerStart}
                  </div>
                  <div className="pointer-events-auto flex items-center gap-3">
                    {headerEnd}
                    <DialogPrimitive.Close render={(
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full bg-black/20 text-white hover:bg-black/40 backdrop-blur-md border border-white/10"
                        aria-label="Close preview"
                      >
                        <XIcon className="size-5" />
                      </Button>
                    )}
                    />
                  </div>
                </div>

                <div className="absolute inset-y-0 inset-x-4 hidden md:flex items-center justify-between pointer-events-none">
                  <NavButton
                    icon={<ChevronLeftIcon className="size-5" />}
                    onClick={scrollPrev}
                    disabled={!canScrollPrev}
                    label="Previous image"
                  />
                  <NavButton
                    icon={<ChevronRightIcon className="size-5" />}
                    onClick={scrollNext}
                    disabled={!canScrollNext}
                    label="Next image"
                  />
                </div>

                {/* Footer */}
                <div className="w-full p-6 flex justify-between items-end bg-gradient-to-t from-black/60 to-transparent pb-safe-bottom">
                  <div className="pointer-events-auto flex items-center gap-3">
                    {footerStart}
                  </div>

                  <div className="absolute left-1/2 -translate-x-1/2 bottom-6 pointer-events-none">
                    <div className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md text-white/90 text-sm font-medium tabular-nums border border-white/10 shadow-sm">
                      {currentIndex + 1}
                      {' '}
                      /
                      {items.length}
                    </div>
                  </div>

                  <div className="pointer-events-auto flex items-center gap-3">
                    {footerEnd}
                  </div>
                </div>
              </div>
            </DialogPrimitive.Popup>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  )
}
ImagePreviewer.displayName = 'ImagePreviewer'

function NavButton({ icon, onClick, disabled, label }: any) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      disabled={disabled}
      aria-label={label}
      className={cn(
        'pointer-events-auto rounded-full size-12 transition-all duration-200',
        'bg-black/20 text-white/90 backdrop-blur-md border border-white/5',
        'hover:bg-black/40 hover:scale-105 active:scale-95',
        'disabled:opacity-0 disabled:pointer-events-none',
      )}
    >
      {icon}
    </Button>
  )
}

export { ImagePreviewer }
