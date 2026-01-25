import type React from 'react'
import type { JSX } from 'react'
import { cn } from '~/lib/utils'

// --- Components for parsed elements ---

interface LinkProps {
  url: string
  text?: string | JSX.Element
  className?: string
}

export function Link({ url, text, className }: LinkProps) {
  return (
    <a
      href={url}
      className={cn(
        className,
        'px-1 text-primary hover:underline underline-offset-4 wrap-anywhere',
      )}
      target="_blank"
      rel="noreferrer"
      onClick={e => e.stopPropagation()} // Avoid triggering card click
    >
      {text || url}
    </a>
  )
}

interface PeopleLinkProps {
  name: string
}

export function PeopleLink({ name }: PeopleLinkProps) {
  return <Link url={`https://x.com/${name}`} text={`@${name}`} />
}

interface HashTagLinkProps {
  tag: string
}

export function HashTagLink({ tag }: HashTagLinkProps) {
  return <Link url={`https://x.com/hashtag/${tag}`} text={`#${tag}`} />
}

// --- Text Parsing Logic ---

type ParsedText = string | JSX.Element
type ParserFn = (text: ParsedText) => ParsedText | ParsedText[]

/**
 * Parses http/https links from a string and replaces them with Link components.
 */
function parseLinks(text: ParsedText): ParsedText | ParsedText[] {
  if (typeof text !== 'string') {
    return text
  }

  const regex = /(https?:\/\/\S+)/g
  const parts = text.split(regex)

  return parts
    .map((part, idx) => {
      if (idx % 2 === 1) {
        return <Link key={`${part}-${idx}`} url={part} />
      }
      return part
    })
    .filter(Boolean)
}

/**
 * Parses hashtags from a string and replaces them with HashTagLink components.
 */
function parseHashtags(text: ParsedText): ParsedText | ParsedText[] {
  if (typeof text !== 'string') {
    return text
  }

  // Matches hashtags: letters, numbers, and underscores only
  // Stops at any other punctuation or whitespace
  const regex = /#([0-9_\p{L}]+)/gu
  const parts = text.split(regex)

  return parts
    .map((part, idx) => {
      if (idx % 2 === 1) {
        return <HashTagLink key={`${part}-${idx}`} tag={part} />
      }
      return part
    })
    .filter(Boolean)
}

/**
 * Parses @mentions from a string and replaces them with PeopleLink components.
 * Twitter usernames are 4-15 chars, letters, numbers, or underscores.
 */
function parseMentions(text: ParsedText): ParsedText | ParsedText[] {
  if (typeof text !== 'string') {
    return text
  }

  const regex = /@(\w{4,15})\b/g
  const parts = text.split(regex)

  return parts
    .map((part, idx) => {
      if (idx % 2 === 1) {
        return <PeopleLink key={`${part}-${idx}`} name={part} />
      }
      return part
    })
    .filter(Boolean)
}

/**
 * Creates a text parser function by chaining together individual parser functions.
 * This allows for an extensible and maintainable parsing pipeline.
 * @param parsers - A list of parser functions to apply in sequence.
 * @returns A function that takes a string and returns an array of parsed text and elements.
 */
function createTextParser(...parsers: ParserFn[]) {
  return function parse(text: string): ParsedText[] {
    const initial: ParsedText[] = [text]

    const result = parsers.reduce((parts, parser) => {
      return parts.flatMap(part => parser(part))
    }, initial)

    return result
  }
}

// The order is important: links first, then mentions and hashtags.
const parseTweetText = createTextParser(
  parseLinks,
  parseMentions,
  parseHashtags,
)

/**
 * Extracts reply information from the beginning of a tweet text.
 * e.g., "@username some content" -> { name: "username", text: "some content" }
 */
function getReplyInfo(text: string) {
  // Match reply-to format at the start of the tweet
  const regex = /^@(\w{4,15})\s(.+)/s
  const match = text.match(regex)

  if (match) {
    return {
      name: match[1],
      text: match[2],
    }
  }

  return {
    name: null,
    text,
  }
}

// --- Main Component ---

interface TweetTextProps {
  text: string
  className?: string
}

export const TweetText: React.FC<TweetTextProps> = ({ text, className }) => {
  const { name: replyToName, text: content } = getReplyInfo(text)

  if (replyToName) {
    return (
      <>
        <p className={cn('py-2 wrap-anywhere', className)}>
          回复
          {' '}
          <PeopleLink name={replyToName} />
          :
        </p>
        <p className={cn('wrap-anywhere', className)}>
          {parseTweetText(content || '')}
        </p>
      </>
    )
  }

  return <p className={cn('pt-2 wrap-anywhere', className)}>{parseTweetText(text)}</p>
}
