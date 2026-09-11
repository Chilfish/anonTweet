#Requires -Version 7.0
<#
  anon-tweet.ps1 — 匿名浏览 Twitter/X 推文与 Instagram 帖子的命令行封装（PowerShell 版）
  =====================================================================================
  纯 PowerShell，无需 curl/python3。读取接口无需 API Key。

  用法：
    pwsh -NoProfile -File anon-tweet.ps1 <命令> [参数...]
    pwsh -NoProfile -File anon-tweet.ps1 help

  命令：
    search   "q" [--type latest|top] [--count N] [--cursor C]   推文搜索（支持 X 高级语法）
    get      <tweetId>                                          单条推文（返回数组，可能为空）
    replies  <tweetId> [--cursor C]                             推文回复（cursor 翻页）
    list     <listId>                                           List 时间线
    user     <username>                                         用户资料
    timeline <username>                                         用户时间线
    ig       <shortcode>                                        Instagram 帖子
    translate <shortcode> [--manual "中文"]                      IG caption 翻译（--manual 则跳过 AI）
    image    <url> [--out FILE]                                 图片代理（二进制落盘）

  通用开关：
    --json                                                      直接输出原始 JSON

  环境变量：
    ANON_TWEET_BASE_URL   覆盖站点地址（默认 https://anon-tweet.chilfish.top）
#>
[CmdletBinding()]
param(
  [Parameter(Position = 0)]
  [string]$Command = 'help',

  [Parameter(Position = 1, ValueFromRemainingArguments = $true)]
  [string[]]$Rest = @()
)

$ErrorActionPreference = 'Stop'
$OutputEncoding = [Console]::InputEncoding = [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()

# 输出策略：交互式终端保留颜色；被重定向/被上层捕获时改走 stdout。
# Write-Host 写入的是 PowerShell 信息流，一旦输出被捕获就会序列化成 "#< CLIXML" 噪音。
$script:UseColor = -not [Console]::IsOutputRedirected

function Write-Ui {
  param([Parameter(Position = 0)][AllowEmptyString()][string]$Text = '', [System.ConsoleColor]$Color)
  if ($script:UseColor -and $PSBoundParameters.ContainsKey('Color')) {
    Write-Host $Text -ForegroundColor $Color
  }
  else {
    Write-Output $Text
  }
}

# skill 版本单源：从同级 SKILL.md 的 frontmatter 读取，避免 UA 里的手写副本漂移。
function Get-SkillVersion {
  $skill = Join-Path $PSScriptRoot '..' 'SKILL.md'
  if (-not (Test-Path -LiteralPath $skill)) { return 'unknown' }
  $m = Select-String -LiteralPath $skill -Pattern '^\s*version:\s*"?([0-9]+\.[0-9]+\.[0-9]+)"?\s*$' | Select-Object -First 1
  if ($m) { return $m.Matches.Groups[1].Value }
  return 'unknown'
}

$script:BaseUrl = if ($env:ANON_TWEET_BASE_URL) { $env:ANON_TWEET_BASE_URL.TrimEnd('/') } else { 'https://anon-tweet.chilfish.top' }
$script:UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) anon-tweet-skill/$(Get-SkillVersion)"
$script:ValueFlags = @('--type', '--count', '--cursor', '--manual', '--out')

function Fail {
  param([string]$Message, [int]$Code = 2)
  Write-Ui $Message -Color Red
  exit $Code
}

function Split-Args {
  param([string[]]$Tokens)
  $pos = [System.Collections.Generic.List[string]]::new()
  $flags = @{}
  for ($i = 0; $i -lt $Tokens.Count; $i++) {
    $t = $Tokens[$i]
    if ($t -match '^(--[a-z][a-z0-9-]*)=(.*)$') { $flags[$Matches[1]] = $Matches[2] }
    elseif ($t.StartsWith('--')) {
      if ($script:ValueFlags -contains $t) {
        if ($i + 1 -ge $Tokens.Count) { Fail "参数 $t 缺少值" }
        $flags[$t] = $Tokens[$i + 1]; $i++
      }
      else { $flags[$t] = $true }
    }
    else { [void]$pos.Add($t) }
  }
  return [pscustomobject]@{ Positional = $pos.ToArray(); Flags = $flags }
}

function Invoke-AnonApi {
  param(
    [string]$Path,
    [string]$Method = 'Get',
    $Body,
    [string]$OutFile,
    [int]$TimeoutSec = 45
  )
  $uri = "$($script:BaseUrl)$Path"
  $headers = @{ 'User-Agent' = $script:UA; Accept = 'application/json' }
  $p = @{ Uri = $uri; Method = $Method; Headers = $headers; TimeoutSec = $TimeoutSec }
  if ($null -ne $Body) {
    $p.Body = [System.Text.Encoding]::UTF8.GetBytes(($Body | ConvertTo-Json -Compress -Depth 6))
    $p.ContentType = 'application/json; charset=utf-8'
  }
  if ($OutFile) { $p.OutFile = $OutFile }
  try {
    if ($OutFile) { Invoke-WebRequest @p; return $null }
    return Invoke-RestMethod @p
  }
  catch {
    $resp = $_.Exception.Response
    $code = if ($resp) { [int]$resp.StatusCode } else { 0 }
    Fail ("请求失败 HTTP {0}：{1}`n{2}" -f $code, $_.Exception.Message, $uri) 1
  }
}

function Format-Tweet {
  param($Tweet, [int]$Index = 0)
  $who = if ($Tweet.user) { "@$($Tweet.user.screen_name) ($($Tweet.user.name))" } else { '?' }
  $head = if ($Index -gt 0) { "[$Index] $who" } else { $who }
  Write-Ui $head -Color Cyan
  if ($Tweet.created_at) { Write-Ui "    $($Tweet.created_at)  lang=$($Tweet.lang)" -Color DarkGray }
  $text = "$($Tweet.text)"
  if ($text) { Write-Ui "    $text" }
  if ($Tweet.url) { Write-Ui "    $($Tweet.url)" -Color DarkGray }
  if ($Tweet.mediaDetails) { Write-Ui "    media x$(@($Tweet.mediaDetails).Count)" -Color DarkGray }
  Write-Ui ''
}

function Show-Tweets {
  param($Data, [string]$Label)
  $tweets = if ($null -eq $Data.tweets) { @() } else { @($Data.tweets) }
  Write-Ui "# $Label  → $($tweets.Count) 条" -Color Cyan
  $i = 0
  foreach ($t in $tweets) { $i++; Format-Tweet $t $i }
  if ($Data.nextCursor) { Write-Ui "nextCursor: $($Data.nextCursor)" -Color Yellow }
  elseif ($tweets.Count -gt 0) { Write-Ui '(无更多：nextCursor=null)' -Color DarkGray }
}

function Invoke-Json {
  param($Data)
  $Data | ConvertTo-Json -Depth 12
}

function Show-AnonHelp {
  Write-Ui @'
用法: anon-tweet.ps1 <命令> [参数...]

命令:
  search    "q" [--type latest|top] [--count N] [--cursor C]   推文搜索（支持 X 高级语法）
  get       <tweetId>                                          单条推文（返回数组，可能为空）
  replies   <tweetId> [--cursor C]                             推文回复（cursor 翻页）
  list      <listId>                                           List 时间线
  user      <username>                                         用户资料
  timeline  <username>                                         用户时间线
  ig        <shortcode>                                        Instagram 帖子
  translate <shortcode> [--manual "中文"]                      IG caption 翻译（--manual 跳过 AI）
  image     <url> [--out FILE]                                 图片代理（二进制落盘）
  help                                                         显示本帮助

通用开关:
  --json                                                       输出原始 JSON

示例:
  pwsh anon-tweet.ps1 search "from:GeminiApp" --type latest --count 5
  pwsh anon-tweet.ps1 get 2032649981690261684
  pwsh anon-tweet.ps1 user meeeei.gt --json
  pwsh anon-tweet.ps1 ig DWlrun0AVbE
'@ -Color Gray
}

# ---------------------------------------------------------------- 命令

function Invoke-Search {
  param([string]$Query, $Flags)
  if (-not $Query) { Fail '用法: anon-tweet.ps1 search "q" [--type latest|top] [--count N] [--cursor C]' }
  $qs = "?q=$([uri]::EscapeDataString($Query))"
  if ($Flags['--type']) { $qs += "&type=$([uri]::EscapeDataString($Flags['--type']))" }
  if ($Flags['--count']) { $qs += "&count=$([int]$Flags['--count'])" }
  if ($Flags['--cursor']) { $qs += "&cursor=$([uri]::EscapeDataString($Flags['--cursor']))" }
  $data = Invoke-AnonApi -Path "/api/tweet/search$qs"
  if ($Flags['--json']) { Invoke-Json $data } else { Show-Tweets $data "搜索: $Query" }
}

function Invoke-Get {
  param([string]$Id, $Flags)
  if (-not $Id) { Fail '用法: anon-tweet.ps1 get <tweetId>' }
  $data = Invoke-AnonApi -Path "/api/tweet/get/$([uri]::EscapeDataString($Id))"
  if ($Flags['--json']) { Invoke-Json $data; return }
  $tweets = if ($null -eq $data) { @() } else { @($data) }
  if ($tweets.Count -eq 0) { Write-Ui "未找到推文（$Id）" -Color Yellow; return }
  Write-Ui "# 推文 $Id  → $($tweets.Count) 条" -Color Cyan
  $i = 0; foreach ($t in $tweets) { $i++; Format-Tweet $t $i }
}

function Invoke-Replies {
  param([string]$Id, $Flags)
  if (-not $Id) { Fail '用法: anon-tweet.ps1 replies <tweetId> [--cursor C]' }
  $qs = ''
  if ($Flags['--cursor']) { $qs = "?cursor=$([uri]::EscapeDataString($Flags['--cursor']))" }
  $data = Invoke-AnonApi -Path "/api/tweet/replies/$([uri]::EscapeDataString($Id))$qs"
  if ($Flags['--json']) { Invoke-Json $data } else { Show-Tweets $data "回复 $Id" }
}

function Invoke-List {
  param([string]$Id, $Flags)
  if (-not $Id) { Fail '用法: anon-tweet.ps1 list <listId>' }
  $data = Invoke-AnonApi -Path "/api/tweet/list/$([uri]::EscapeDataString($Id))"
  if ($Flags['--json']) { Invoke-Json $data; return }
  $tweets = if ($null -eq $data) { @() } else { @($data) }
  Write-Ui "# List $Id  → $($tweets.Count) 条" -Color Cyan
  $i = 0; foreach ($t in $tweets) { $i++; Format-Tweet $t $i }
}

function Invoke-User {
  param([string]$Username, $Flags)
  if (-not $Username) { Fail '用法: anon-tweet.ps1 user <username>' }
  $data = Invoke-AnonApi -Path "/api/user/get/$([uri]::EscapeDataString($Username))"
  if ($Flags['--json']) { Invoke-Json $data; return }
  if ($null -eq $data) { Write-Ui "无记录（$Username，可能是 DB 未缓存）" -Color Yellow; return }
  Write-Ui "@$($data.userName)  $($data.fullName)" -Color Cyan
  Write-Ui "    followers=$($data.followersCount)  following=$($data.followingsCount)  posts=$($data.statusesCount)  likes=$($data.likeCount)"
  Write-Ui "    verified=$($data.isVerified)  created=$($data.createdAt)  location=$($data.location)"
  if ($data.description) { Write-Ui "    $($data.description)" }
}

function Invoke-Timeline {
  param([string]$Username, $Flags)
  if (-not $Username) { Fail '用法: anon-tweet.ps1 timeline <username>' }
  $data = Invoke-AnonApi -Path "/api/user/timeline/$([uri]::EscapeDataString($Username))"
  if ($Flags['--json']) { Invoke-Json $data; return }
  $tweets = if ($null -eq $data) { @() } else { @($data) }
  Write-Ui "# @$Username 时间线  → $($tweets.Count) 条" -Color Cyan
  $i = 0; foreach ($t in $tweets) { $i++; Format-Tweet $t $i }
}

function Invoke-Ig {
  param([string]$Shortcode, $Flags)
  if (-not $Shortcode) { Fail '用法: anon-tweet.ps1 ig <shortcode>' }
  $data = Invoke-AnonApi -Path "/api/ig/get/$([uri]::EscapeDataString($Shortcode))"
  if ($Flags['--json']) { Invoke-Json $data; return }
  $posts = if ($null -eq $data) { @() } else { @($data) }
  if ($posts.Count -eq 0) { Write-Ui "空结果（$Shortcode）：未配置 INS_COOKIES 时 IG 接口返回空数组" -Color Yellow; return }
  $i = 0
  foreach ($p in $posts) {
    $i++
    Write-Ui "[$i] @$($p.username)  $($p.type)  $($p.url)" -Color Cyan
    if ($p.tags) { Write-Ui "    tags: $(@($p.tags) -join ', ')" -Color DarkGray }
    if ($p.likes) { Write-Ui "    likes=$($p.likes)" -Color DarkGray }
    $desc = "$($p.description)"
    if ($desc) { Write-Ui "    $desc" }
    $media = if ($null -eq $p.media) { @() } else { @($p.media) }
    foreach ($m in $media) { Write-Ui "    - [$($m.type)] $($m.url)" -Color DarkGray }
    Write-Ui ''
  }
}

function Invoke-Translate {
  param([string]$Shortcode, $Flags)
  if (-not $Shortcode) { Fail '用法: anon-tweet.ps1 translate <shortcode> [--manual "中文"]' }
  $body = @{}
  if ($Flags['--manual']) { $body.manualTranslation = $Flags['--manual'] }
  else { Fail '翻译接口需自备 apiKey/model/provider：请直接 POST /api/ig/translate/{id}（见 SKILL.md），或用 --manual 传已有译文' }
  $data = Invoke-AnonApi -Path "/api/ig/translate/$([uri]::EscapeDataString($Shortcode))" -Method Post -Body $body
  if ($Flags['--json']) { Invoke-Json $data; return }
  Write-Ui "# $Shortcode 翻译" -Color Cyan
  $posts = if ($null -eq $data) { @() } else { @($data) }
  foreach ($p in $posts) {
    $translated = if ($p.translatedText) { $p.translatedText } elseif ($p.description) { $p.description } else { $p }
    Write-Ui "    $translated"
  }
}

function Invoke-Image {
  param([string]$Url, $Flags)
  if (-not $Url) { Fail '用法: anon-tweet.ps1 image <url> [--out FILE]' }
  $out = $Flags['--out']
  if (-not $out) {
    $ext = if ($Url -match '\.(jpe?g|png|webp|gif|avif)(\?|$)') { $Matches[1] } else { 'jpg' }
    $out = Join-Path $env:TEMP "anon-tweet-image.$ext"
  }
  $null = Invoke-AnonApi -Path "/api/proxy/image?url=$([uri]::EscapeDataString($Url))" -OutFile $out
  Write-Ui "已保存: $out" -Color Green
}

$cmd = $Command.ToLower()
switch ($cmd) {
  'search' { $p = Split-Args $Rest; Invoke-Search $p.Positional[0] $p.Flags }
  'get' { $p = Split-Args $Rest; Invoke-Get $p.Positional[0] $p.Flags }
  'replies' { $p = Split-Args $Rest; Invoke-Replies $p.Positional[0] $p.Flags }
  'list' { $p = Split-Args $Rest; Invoke-List $p.Positional[0] $p.Flags }
  'user' { $p = Split-Args $Rest; Invoke-User $p.Positional[0] $p.Flags }
  'timeline' { $p = Split-Args $Rest; Invoke-Timeline $p.Positional[0] $p.Flags }
  'ig' { $p = Split-Args $Rest; Invoke-Ig $p.Positional[0] $p.Flags }
  'translate' { $p = Split-Args $Rest; Invoke-Translate $p.Positional[0] $p.Flags }
  'image' { $p = Split-Args $Rest; Invoke-Image $p.Positional[0] $p.Flags }
  'help' { Show-AnonHelp }
  '-h' { Show-AnonHelp }
  '--help' { Show-AnonHelp }
  default { Write-Ui "未知命令: $Command" -Color Red; Show-AnonHelp; exit 2 }
}
