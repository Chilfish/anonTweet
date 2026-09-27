import type { ReactNode } from 'react'
import type { ArticleBlock, ArticleRun } from '~/types'
import { Separator } from '~/components/ui/separator'
import { TweetLink } from '~/lib/react-tweet/twitter-theme/tweet-link'
import { cn } from '~/lib/utils'
import { ArticleEmbedTweet } from './ArticleEmbedTweet'
import { ArticleImage } from './ArticleImage'
import { ArticleMarkdown } from './ArticleMarkdown'
import { ArticleRuns } from './ArticleRuns'
import { ArticleTranslatedText } from './ArticleTranslatedText'

export type ArticleViewMode = 'original' | 'translation' | 'bilingual'

/** 非列表块（列表项由外层归组为 <ul>/<ol> 统一渲染） */
type ListBlock = Extract<ArticleBlock, { type: 'list-item' }>
type FlowBlock = Exclude<ArticleBlock, ListBlock>

const TEXT_CLASS = 'text-[15px] leading-7 text-foreground/90'

const HEADING: Record<1 | 2 | 3, { tag: 'h2' | 'h3' | 'h4', className: string }> = {
  1: { tag: 'h2', className: 'mt-8 mb-3 text-xl font-bold text-foreground' },
  2: { tag: 'h3', className: 'mt-7 mb-2 text-lg font-semibold text-foreground' },
  3: { tag: 'h4', className: 'mt-6 mb-2 text-base font-semibold text-foreground' },
}

/**
 * 三态块文本：原文 / 仅译文 / 双语（原文 + 次级色译文）。
 * 无译文或 `original` 模式时退化为原文，不引入空节点。
 */
function BlockText({ runs, translation, mode }: {
  runs: ArticleRun[]
  translation?: string
  mode: ArticleViewMode
}) {
  if (!translation || mode === 'original')
    return <ArticleRuns runs={runs} />

  if (mode === 'translation')
    return <ArticleTranslatedText translation={translation} runs={runs} />

  return (
    <>
      <ArticleRuns runs={runs} />
      <span className="mt-1 block border-l-2 border-border/70 pl-2.5 text-muted-foreground">
        <ArticleTranslatedText translation={translation} runs={runs} />
      </span>
    </>
  )
}

function FlowBlockView({ block, translation, mode, renderEmbed }: {
  block: FlowBlock
  translation?: string
  mode: ArticleViewMode
  renderEmbed?: (tweetId: string) => ReactNode
}) {
  switch (block.type) {
    case 'markdown':
      return <ArticleMarkdown text={block.text} />
    case 'divider':
      return <Separator className="my-4" />
    case 'image':
      return <ArticleImage media={block.media} caption={block.caption} />
    case 'embed-tweet':
      // 内嵌推文：阅读页注入真实推文组件；缺省（含离线渲染/取数失败）回退为轻量链接卡
      return <>{renderEmbed?.(block.tweetId) ?? <ArticleEmbedTweet tweetId={block.tweetId} />}</>
    case 'link':
      return (
        <p className={TEXT_CLASS}>
          <TweetLink href={block.url}>{block.url}</TweetLink>
        </p>
      )
    case 'unknown':
      return block.text
        ? <p className={cn(TEXT_CLASS, 'whitespace-pre-wrap')}>{block.text}</p>
        : null
    case 'paragraph':
      return (
        <p className={cn(TEXT_CLASS, 'whitespace-pre-wrap')}>
          <BlockText runs={block.runs} translation={translation} mode={mode} />
        </p>
      )
    case 'heading': {
      const { tag: Tag, className } = HEADING[block.level]
      return (
        <Tag className={className}>
          <BlockText runs={block.runs} translation={translation} mode={mode} />
        </Tag>
      )
    }
    case 'quote':
      return (
        <blockquote className="border-l-2 border-border pl-3 text-muted-foreground italic">
          <BlockText runs={block.runs} translation={translation} mode={mode} />
        </blockquote>
      )
  }
}

type BlockGroup
  = | { kind: 'list', key: string, ordered: boolean, items: ListBlock[] }
    | { kind: 'block', key: string, block: FlowBlock }

/** 相邻且有序性一致的 list-item 归组为一个列表，其余块各自成组 */
function groupBlocks(blocks: ArticleBlock[]): BlockGroup[] {
  const groups: BlockGroup[] = []

  for (const block of blocks) {
    if (block.type !== 'list-item') {
      groups.push({ kind: 'block', key: block.key, block })
      continue
    }

    const last = groups[groups.length - 1]
    if (last?.kind === 'list' && last.ordered === block.ordered) {
      last.items.push(block)
      continue
    }
    groups.push({ kind: 'list', key: block.key, ordered: block.ordered, items: [block] })
  }

  return groups
}

interface ArticleBodyProps {
  blocks: ArticleBlock[]
  /** 按块 key 索引的译文（缺省即无译文） */
  translations?: Record<string, string>
  mode?: ArticleViewMode
  className?: string
  /**
   * 内嵌推文的自定义渲染。由阅读页注入真实的只读推文组件（数据并行取回）；
   * 缺省或返回空值时回退为轻量链接卡（离线渲染 / 取数失败）。
   */
  renderEmbed?: (tweetId: string) => ReactNode
}

/** 块文档渲染器：按块翻译的三态（原文 / 译文 / 双语）由此统一承载 */
export function ArticleBody({ blocks, translations, mode = 'original', className, renderEmbed }: ArticleBodyProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {groupBlocks(blocks).map((group) => {
        if (group.kind === 'block') {
          return (
            <FlowBlockView
              key={group.key}
              block={group.block}
              translation={translations?.[group.key]}
              mode={mode}
              renderEmbed={renderEmbed}
            />
          )
        }

        const ListTag = group.ordered ? 'ol' : 'ul'
        return (
          <ListTag
            key={group.key}
            className={cn(
              'space-y-1.5 pl-5 text-[15px] leading-7 text-foreground/90',
              group.ordered ? 'list-decimal' : 'list-disc',
            )}
          >
            {group.items.map(item => (
              <li key={item.key}>
                <BlockText
                  runs={item.runs}
                  translation={translations?.[item.key]}
                  mode={mode}
                />
              </li>
            ))}
          </ListTag>
        )
      })}
    </div>
  )
}
