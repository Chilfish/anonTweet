import type { ComponentProps } from 'react'
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
      disabled={isCapturing}
      onClick={onScreenshot}
      {...props}
    >
      <span>
        {isCapturing ? '截图中...' : '截图'}
      </span>
    </Button>
  )
}
