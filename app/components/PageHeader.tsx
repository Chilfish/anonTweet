export function PageHeader() {
  return (
    <div className="text-center space-y-4 mb-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Chill Tweet
        </h1>
        <p className="text-xl text-muted-foreground">
          优雅地查看和分享 Twitter 推文
        </p>
      </div>
      
      <div className="max-w-2xl mx-auto text-muted-foreground space-y-2">
        <p>
          一个简洁美观的 Twitter 推文查看器，支持直接输入推文链接或 ID。
        </p>
        <p className="text-sm">
          无需登录，无广告干扰，专注于内容本身。
        </p>
      </div>
    </div>
  );
}