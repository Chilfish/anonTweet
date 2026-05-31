import type { ComponentProps } from 'react'
import { Image } from 'lucide-react'
import { Button } from '~/components/ui/button'

interface IGScreenshotButtonProps extends ComponentProps<typeof Button> {
  isCapturing: boolean
  onScreenshot: () => void
}

/**
 * Instagram 截图按钮。
 *
 * 触发 useIGScreenshotAction 的 handleScreenshot。
 */
export function IGScreenshotButton({
  isCapturing,
  onScreenshot,
  ...props
}: IGScreenshotButtonProps) {
  return (
    <Button
      variant="outline"
      disabled={isCapturing}
      onClick={onScreenshot}
      {...props}
    >
      <Image className="size-4" />
      <span className="hidden sm:inline">
        {isCapturing ? '截图中...' : '截图'}
      </span>
    </Button>
  )
}
