import { useIsMobile } from '~/hooks/use-mobile'
import { HankoMark } from './HankoMark'

export function PageHeader() {
  const isMobile = useIsMobile()

  return (
    <div className="text-center space-y-4 mb-12">
      <div className="space-y-2">
        <div className="flex items-start justify-center gap-3">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            <ruby>
              あのん
              <rp>(</rp>
              <rt className="text-sm text-muted-foreground">Anonymously</rt>
              <rp>)</rp>
            </ruby>
            <span className="ml-2">
              Tweet
            </span>
          </h1>
          <HankoMark className="mt-2.5" />
        </div>
        <p className="text-xl">
          匿名地查看和分享 Twitter 推文与 Instagram 帖子
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-2 text-muted-foreground">
        <p>
          一个简洁美观的推文 / Instagram 查看与媒体下载器。
        </p>
        <p className="text-sm">
          可以手动输入推文翻译内容并导出推文卡片为图片。
        </p>
        {isMobile && (
          <p className="text-xs">
            （在手机端需要先横屏再保存推文为图片，以获得最佳宽度）
          </p>
        )}
      </div>
    </div>
  )
}
