import { useIsMobile } from '~/hooks/use-mobile'

export function PageHeader() {
  const isMobile = useIsMobile()
  return (
    <div className="text-center space-y-4 mb-12">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight bg-linear-to-r from-pink-400 to-[#1d9bf0] bg-clip-text text-transparent">
          <ruby>
            あのん
            <rp>(</rp>
            <rt className="text-sm">Anonymously</rt>
            <rp>)</rp>
          </ruby>
          <span className="ml-2">
            Tweet
          </span>
        </h1>
        <p className="text-xl">
          匿名地查看和分享 Twitter 推文
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-2">
        <p>
          一个简洁美观的推文查看/媒体下载器。
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
