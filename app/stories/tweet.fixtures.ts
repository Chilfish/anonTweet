import type { AIVisionInfo, EnrichedTweet, TrendingCardInfo, TweetUser } from '~/types'

/**
 * app/stories/tweet.fixtures.ts —— tweet 组件故事共享数据
 *
 * 视觉输入对齐「官方对照 + 自身优化」：文本/卡片/分类/头像均取自真实 fixture
 * （test/fixtures/jetfuel/trending.json、tweets/with-card-ja.json、vision/tweet-multi-photo.json），
 * 便于与线上渲染、AC 断言互相印证。纯客户端数据，无 fs / 无网络。
 */

const user: TweetUser = {
  id_str: '1910260789350682624',
  name: '渡瀬結月の６げんめっ！',
  profile_image_url_https: 'https://pbs.twimg.com/profile_images/1910261300489551872/qvYWaoMv.jpg',
  profile_image_shape: 'Circle',
  screen_name: '6genme',
  verified: false,
  is_blue_verified: false,
}

/** 真实 jetfuel payload 解析结果（与 AC-CARD-003 / card-render.spec.ts 同源） */
export const trendingInfo: TrendingCardInfo = {
  source: 'jetfuel',
  url: 'https://x.com/i/trending/2088645888549994981',
  imageUrl: 'https://pbs.twimg.com/media/HPxZhM0aQAAZxz3.jpg?name=orig',
  categories: ['Entertainment', 'Celebrity'],
  avatars: [
    'https://pbs.twimg.com/profile_images/2073745277383819265/hNIVGY1h_normal.jpg',
    'https://pbs.twimg.com/profile_images/2034541349169774592/Y65t9P5F_normal.jpg',
    'https://pbs.twimg.com/profile_images/1722602835299500033/hXskVj9F_normal.png',
  ],
  postsCount: '16.5k posts',
  title: '仲町あられの誕生日をファンと盛大に祝う',
  description: '仮想バンド「夢限大みゅーたいぷ」のボーカル・仲町あられの誕生日を、8月16日にXでファンアートやメッセージが大いに盛り上がっています。あられさんはYouTube登録者数55,555人突破を祝いつつ感謝を伝え、公式アカウントは22時からの生誕記念配信を告知。大切なお知らせもあり、ブルーレイオンラインストアでは描き下ろしイラストのバースデーグッズ受注がスタートしました。身長154cmの元気なあられちゃんを、ファンみんなで祝う一日です。',
}

export const summaryCard = {
  type: 'summary' as const,
  url: 'https://t.co/v34aHROs13',
  title: '渡瀬結月の6げんめっ！=15げんめっ=',
  description: '番組ハッシュタグ：#6げんめっ パーソナリティ：渡瀬結月 渡瀬結月がお届けする、生放送バラエティ番組です！ 番組では、皆様からのお便りも募集しております。',
  domain: 'live.nicovideo.jp',
  imageUrl: 'https://pbs.twimg.com/card_img/2067826373734055936/2dzFQKk9?format=png&name=orig',
}

export const largeImageCard = {
  type: 'summary_large_image' as const,
  url: 'https://youtu.be/dQw4w9WgXcQ',
  title: 'YouTube 影片预览：寬幅揮洒大圖卡',
  description: '这是一个 summary_large_image 卡片的示例描述，足够长以测试 line-clamp 的截断效果。',
  domain: 'youtube.com',
  imageUrl: 'https://pbs.twimg.com/card_img/2067826373734055936/2dzFQKk9?format=jpg&name=orig',
}

export const longDescriptionCard = {
  type: 'summary' as const,
  url: 'https://example.com/long',
  title: '只有文字没有图的链接卡（超长标题）',
  description: '没有图片的卡片，仅展示域名、标题与描述。标题很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长很长，全靠 line-clamp-2 截断。',
  domain: 'example.com',
  // LinkPreviewCard.imageUrl 为必填字符串；空串表示「无图」，组件按 hasImage=false 走纯文字布局
  imageUrl: '',
}

interface MakeTweetOptions {
  id?: string
  text?: string
  name?: string
  screenName?: string
  lang?: string
  entities?: EnrichedTweet['entities']
  card?: EnrichedTweet['card']
  mediaDetails?: EnrichedTweet['mediaDetails']
  visionInfo?: AIVisionInfo[]
  quotedTweet?: EnrichedTweet
  comments?: EnrichedTweet[]
  createdAt?: string
}

function makeTweet(opts: MakeTweetOptions = {}): EnrichedTweet {
  return {
    id_str: opts.id ?? '2063856871824584747',
    __typename: 'Tweet',
    lang: opts.lang ?? 'ja',
    url: `https://twitter.com/${opts.screenName ?? '6genme'}/status/${opts.id ?? '2063856871824584747'}`,
    created_at: opts.createdAt ?? 'Mon Jun 08 05:33:17 +0000 2026',
    text: opts.text
      ?? '『#渡瀬結月 の #６げんめっ！』#15\n\n６月の放送日は6/24（水）21時～です！\n今月もお楽しみに！\n#ゆむんちゅ',
    user: user.name === opts.name
      ? user
      : { ...user, name: opts.name ?? user.name, screen_name: opts.screenName ?? user.screen_name },
    entities: opts.entities ?? [{ type: 'text', text: '『#渡瀬結月 の #６げんめっ！』#15', index: 0 }],
    card: opts.card,
    mediaDetails: opts.mediaDetails,
    visionInfo: opts.visionInfo,
    quotedTweet: opts.quotedTweet,
    comments: opts.comments,
  }
}

/** 摘要卡（小图缩略布局） */
export const tweetWithCard = makeTweet({
  card: { ...summaryCard },
})

/** 官方 Trending 变体（真实 jetfuel 数据） */
export const tweetWithTrendingCard = makeTweet({
  id: '2089577916694942006',
  text: 'WOW…！むっぴょうれぴー！⸜🌷︎⸝✨️\n嬉しいからポストして残しとこう\nhttps://t.co/2cFszADge0',
  card: { ...summaryCard, type: 'unified_card', url: 'https://t.co/2cFszADge0', trending: { ...trendingInfo } },
})

/** trending 主图缺失（回退不塌陷场景） */
export const tweetTrendingNoImage = makeTweet({
  card: { ...summaryCard, trending: { ...trendingInfo, imageUrl: '' } },
})

/** 宽幅大图卡（summary_large_image，1.91:1） */
export const tweetWithLargeImageCard = makeTweet({
  card: { ...largeImageCard },
})

/** 无图文字卡 */
export const tweetWithTextOnlyCard = makeTweet({
  card: { ...longDescriptionCard },
})

/** 完全无卡片数据（空渲染） */
export const tweetNoCard = makeTweet({})

/** 三张配图 + Alt 文本（对齐 vision fixture；含 media_alt 翻译实体，index 20000+i） */
export const tweetWithPhotos = makeTweet({
  id: '9000000000000000001',
  text: 'スクリーンショットを添付します https://t.co/vision',
  entities: [
    { type: 'text', text: 'スクリーンショットを添付します ', index: 0, aiTranslation: '附上截图 ' },
    {
      type: 'media_alt',
      text: '冬の街並みのスクリーンショット。雪が積もっている。',
      index: 20000,
      aiTranslation: '冬季街景截图。积雪覆盖。',
    },
    {
      type: 'media_alt',
      text: '料理の写真。ラーメンと餃子が写っている。',
      index: 20001,
      aiTranslation: '料理照片。拍到了拉面和饺子。',
    },
    {
      type: 'media_alt',
      text: 'オフィスの机の上にノートパソコンとコーヒー。',
      index: 20002,
      aiTranslation: '办公桌上放着笔记本电脑和咖啡。',
    },
  ],
  mediaDetails: [
    {
      index: 0,
      media_url_https: 'https://pbs.twimg.com/media/vision0.jpg',
      original_info: { height: 400, width: 300 },
      type: 'photo',
      ext_alt_text: '冬の街並みのスクリーンショット。雪が積もっている。',
    },
    {
      index: 1,
      media_url_https: 'https://pbs.twimg.com/media/vision1.jpg',
      original_info: { height: 400, width: 300 },
      type: 'photo',
      ext_alt_text: '料理の写真。ラーメンと餃子が写っている。',
    },
    {
      index: 2,
      media_url_https: 'https://pbs.twimg.com/media/vision2.jpg',
      original_info: { height: 400, width: 300 },
      type: 'photo',
      ext_alt_text: 'オフィスの机の上にノートパソコンとコーヒー。',
    },
  ],
})

/** 有图但无 Alt 文本（TweetMediaAlt 空态） */
export const tweetWithPhotosNoAlt = makeTweet({
  id: '9000000000000000004',
  text: '写真だけのツイート https://t.co/photo',
  mediaDetails: [
    {
      index: 0,
      media_url_https: 'https://pbs.twimg.com/media/nophoto0.jpg',
      original_info: { height: 400, width: 300 },
      type: 'photo',
    },
    {
      index: 1,
      media_url_https: 'https://pbs.twimg.com/media/nophoto1.jpg',
      original_info: { height: 400, width: 300 },
      type: 'photo',
    },
  ],
})

/** AI 视觉描述已完成（describe 模式，双语可见性由 store 决定） */
export const tweetWithVisionDone = makeTweet({
  id: '9000000000000000002',
  text: 'スクリーンショットを添付します https://t.co/vision',
  mediaDetails: tweetWithPhotos.mediaDetails,
  visionInfo: [
    {
      index: 0,
      mode: 'describe',
      promptId: 'describe',
      provider: 'google',
      model: 'gemini-3-flash',
      description: '冬の街並みの写真。雪が積もった道路と、明かりの点いた家々が写っている。',
      status: 'done',
      createdAt: Date.now(),
    },
    {
      index: 1,
      mode: 'describe',
      promptId: 'describe',
      provider: 'google',
      model: 'gemini-3-flash',
      description: 'ラーメンと餃子のアップ写真。湯気が立ち、食欲をそそる。',
      status: 'done',
      createdAt: Date.now(),
    },
    {
      index: 2,
      mode: 'describe',
      provider: 'google',
      model: 'gemini-3-flash',
      promptId: 'describe',
      description: 'オフィスデスクの写真。ノートパソコンとコーヒーカップが置かれている。',
      status: 'done',
      createdAt: Date.now(),
    },
  ],
})

/** 带一条错误结果的视觉块（展示错误态） */
export const tweetWithVisionError = makeTweet({
  id: '9000000000000000003',
  text: 'スクリーンショットを添付します https://t.co/vision',
  mediaDetails: tweetWithPhotos.mediaDetails,
  visionInfo: [
    {
      index: 0,
      mode: 'describe',
      promptId: 'describe',
      provider: 'google',
      model: 'gemini-3-flash',
      description: '冬の街並みの写真。',
      status: 'done',
      createdAt: Date.now(),
    },
    {
      index: 1,
      mode: 'describe',
      promptId: 'describe',
      provider: 'google',
      model: 'gemini-3-flash',
      status: 'error',
      error: '图片内容审查未通过，请重试或更换图片。',
      createdAt: Date.now(),
    },
  ],
})

/** 翻译数据（原文实体 + aiTranslation，手动/双语模式用） */
export const translatedText = '『渡瀬結月 的第6げんめっ！』第15回\n\n6月的播出日是6/24（周三）21点开始！\n这个月也敬请期待！\n#ゆむんちゅ'

/** 英文推文（翻译体验场景） */
export const tweetEnglish = makeTweet({
  id: '9000000000000000100',
  lang: 'en',
  text: 'Just shipped the new design 🚀 The team worked hard on this one — check it out and let us know what you think!',
  name: 'Chil Fish',
  screenName: 'chilfish',
  entities: [{
    type: 'text',
    text: 'Just shipped the new design 🚀 The team worked hard on this one — check it out and let us know what you think!',
    index: 0,
    aiTranslation: '刚发布了新设计 🚀 团队在这上面下了很大功夫——快来看看，告诉我们你的想法！',
  }],
})

/** 评论分支：主推 + 2 条回复 */
export const tweetWithComments = makeTweet({
  id: '9000000000000000200',
  text: '新機能どうだった？感想お待ちしてます！',
  comments: [
    makeTweet({
      id: '9000000000000000201',
      text: 'めっちゃ使いやすい！特に翻訳が速いのが良いですね',
      name: 'ファンA',
      screenName: 'fan_a',
      createdAt: 'Mon Jun 08 06:00:00 +0000 2026',
    }),
    makeTweet({
      id: '9000000000000000202',
      text: 'スクショ機能が便利すぎる。毎日使ってます',
      name: 'ファンB',
      screenName: 'fan_b',
      createdAt: 'Mon Jun 08 07:12:00 +0000 2026',
    }),
  ],
})

/** 长线程（MyPlainTweet / 截图性能场景）：3 条祖先 + 主推 */
export const threadTweets: EnrichedTweet[] = [
  makeTweet({
    id: '9000000000000000300',
    text: '今日から新しい連載を始めます。全15回、毎日更新予定です。第1回は「はじめに」。',
    name: '連載作家',
    screenName: 'rensai_sakka',
    createdAt: 'Tue Jun 09 21:00:00 +0000 2026',
  }),
  makeTweet({
    id: '9000000000000000301',
    text: '第2回：この連載で伝えたいこと。ものづくりにおける「丁寧さ」の大切さについて。',
    name: '連載作家',
    screenName: 'rensai_sakka',
    createdAt: 'Tue Jun 09 21:01:00 +0000 2026',
  }),
  makeTweet({
    id: '9000000000000000302',
    text: '第3回：実際の手順とツール。今回はスクリーンショット機能の実装例を紹介します。',
    name: '連載作家',
    screenName: 'rensai_sakka',
    card: { ...summaryCard },
    createdAt: 'Tue Jun 09 21:02:00 +0000 2026',
  }),
]

/** 翻译线程（主推为带 aiTranslation 的英文推文，祖先为日文） */
export const translationThreadTweets: EnrichedTweet[] = [
  makeTweet({
    id: '9000000000000000310',
    text: '前回の続き：UI 実装の基本方針についてまとめます。',
    name: '連載作家',
    screenName: 'rensai_sakka',
    createdAt: 'Tue Jun 09 21:00:00 +0000 2026',
  }),
  makeTweet({
    id: '9000000000000000311',
    text: 'コンポーネント設計のコツ：状態を上に、表示を下に。',
    name: '連載作家',
    screenName: 'rensai_sakka',
    createdAt: 'Tue Jun 09 21:01:00 +0000 2026',
  }),
  tweetEnglish,
]

/** 引推文（quoted 变体） */
export const tweetWithQuoted = makeTweet({
  id: '9000000000000000400',
  text: 'このツイートが参考になりました。ぜひ読んでみてください。',
  quotedTweet: makeTweet({
    id: '9000000000000000401',
    text: 'React Router v8 の SSR ハイブリッド構成で作った匿名閲覧ツールの話です。',
    name: '匿名開発者',
    screenName: 'anonymous_dev',
  }),
})
