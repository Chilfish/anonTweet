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

        <p className="text-xs">
          （页面设计、逻辑优化的测试版本已发布，
          <a
            className="text-primary underline-offset-4 hover:underline"
            target="_blank"
            href="https://anon-tweet-dev.chilfish.top"
          >
            点击试用
          </a>
          。如有问题，还请联系
          <a
            className="text-primary underline-offset-4 hover:underline"
            target="_blank"
            href="https://space.bilibili.com/259486090"
          >
            @Chilfish
          </a>
          ）
        </p>
      </div>
    </div>
  )
}
