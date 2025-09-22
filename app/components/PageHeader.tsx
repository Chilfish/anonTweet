import { useIsMobile } from "~/hooks/use-mobile";

export function PageHeader() {
  const isMobile = useIsMobile();
  return (
    <div className="text-center space-y-4 mb-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
          <ruby>
            Anon
            <rp>(</rp><rt className="text-sm">Anonymously</rt><rp>)</rp>
          </ruby>
          <span className="ml-2">
            Tweet
          </span>
        </h1>
        <p className="text-xl text-muted-foreground">
          匿名地查看和分享 Twitter 推文
        </p>
      </div>

      <div className="max-w-2xl mx-auto text-muted-foreground space-y-2">
        <p>
          一个简洁美观的推文查看器，直接输入推文链接或 ID。
        </p>
        <p className="text-sm">
          可以手动输入推文翻译内容并导出推文卡片为图片。
        </p>

        {isMobile && (
          <p className="text-xs">
            （在手机端，需要先横屏再保存推文为图片，以获得最佳宽度）
          </p>
        )}
      </div>
    </div>
  );
}