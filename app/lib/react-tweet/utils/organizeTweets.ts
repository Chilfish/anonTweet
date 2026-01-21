import type { EnrichedTweet, TweetData } from '~/types'

interface OrganizeOptions {
  showComments?: boolean
  filterUnrelated?: boolean
  excludeUsers?: string[]
  allowedAuthors?: string[] // Users whose interactions we want to keep
}

export interface OrganizedTweets {
  mainTweet: EnrichedTweet | null
  ancestors: EnrichedTweet[]
  commentThreads: EnrichedTweet[]
  allowedAuthors: string[]
}

/**
 * Organizes a flat list of tweets into a threaded structure with ancestors and comments.
 * Also supports filtering out unrelated comments based on interaction with allowed authors.
 */
export function organizeTweets(
  tweets: TweetData,
  mainTweetId: string,
  options: OrganizeOptions = {},
): OrganizedTweets {
  const {
    showComments = true,
    filterUnrelated = false,
    excludeUsers = [],
    allowedAuthors: providedAllowedAuthors,
  } = options

  const tweetMap = new Map<string, EnrichedTweet>(
    tweets.map(t => [t.id_str, { ...t, comments: [] }]),
  )

  const mainTweet = tweetMap.get(mainTweetId)
  if (!mainTweet) {
    return { mainTweet: null, ancestors: [], commentThreads: [], allowedAuthors: [] }
  }

  // Determine allowed authors for filtering (default to main tweet author)
  const mainAuthor = mainTweet.user.screen_name
  // Initialize Set with explicit allow-list or just the main author
  const allowedAuthors = new Set(providedAllowedAuthors || [mainAuthor])

  // 1. Build Ancestors chain
  const ancestors: EnrichedTweet[] = []
  let curr = mainTweet
  const visited = new Set<string>([mainTweetId])

  while (curr.in_reply_to_status_id_str) {
    const parent = tweetMap.get(curr.in_reply_to_status_id_str)
    if (parent && !visited.has(parent.id_str)) {
      ancestors.unshift(parent)
      visited.add(parent.id_str)
      curr = parent
    }
    else {
      break
    }
  }

  // If an allowed author (e.g. Main Author) replies to someone, that person becomes "allowed".
  // This solves the "unrelated tweets" issue by ensuring we only keep replies that actually involved an interaction.
  if (showComments) {
    let sizeBefore = 0
    // We loop until stable to handle chains of trust if necessary,
    // though usually one pass is enough for "replies main author interacted with".
    // Limiting to 2 passes to prevent potential perf issues on huge sets,
    // but 1 pass is strictly sufficient for "Main Author -> Reply Author".
    let passes = 0
    while (allowedAuthors.size > sizeBefore && passes < 2) {
      sizeBefore = allowedAuthors.size
      tweets.forEach((t) => {
        // If the sender is trusted (e.g. Main Author)
        if (allowedAuthors.has(t.user.screen_name)) {
          const parentId = t.in_reply_to_status_id_str
          if (parentId) {
            const parentTweet = tweetMap.get(parentId)
            // If we found the parent, and its author isn't excluded, add them to trusted list
            if (parentTweet && !excludeUsers.includes(parentTweet.user.screen_name)) {
              allowedAuthors.add(parentTweet.user.screen_name)
            }
          }
        }
      })
      passes++
    }
  }

  if (!showComments) {
    return { mainTweet, ancestors, commentThreads: [], allowedAuthors: Array.from(allowedAuthors) }
  }

  // 2. Build Comment Tree
  const repliesByParent = new Map<string, EnrichedTweet[]>()
  const threadIds = new Set([mainTweetId, ...ancestors.map(a => a.id_str)])

  tweets.forEach((t) => {
    // Skip if it's part of the main thread or ancestor chain (already handled)
    if (threadIds.has(t.id_str))
      return

    // Skip excluded users
    if (excludeUsers.includes(t.user.screen_name))
      return

    const pid = t.in_reply_to_status_id_str
    if (pid) {
      if (!repliesByParent.has(pid))
        repliesByParent.set(pid, [])
      repliesByParent.get(pid)!.push(tweetMap.get(t.id_str)!)
    }
  })

  const buildTree = (parentId: string): EnrichedTweet[] => {
    const replies = repliesByParent.get(parentId) || []
    const results: EnrichedTweet[] = []

    for (const reply of replies) {
      const isAuthorAllowed = allowedAuthors.has(reply.user.screen_name)

      // Filter logic fix:
      // If filterUnrelated is TRUE, we strictly require the author to be in the allowed list.
      // (The allowed list now includes anyone the main author replied to).
      // We DO NOT check `isReplyingToAllowed` here because that allows spam/unrelated replies
      // to the main author to slip through.
      const shouldKeep = !filterUnrelated || isAuthorAllowed

      if (shouldKeep) {
        // Recursively build tree, passing current reply ID
        const children = buildTree(reply.id_str)

        // Optimization: If filtering is ON, and this node is not allowed,
        // strictly speaking we wouldn't be here.
        // But if filtering is OFF, or complex logic allows a node but it has no children
        // and provides no value, one could filter further.
        // For now, we adhere to the strict "Is Author Allowed" rule.

        const processedReply = {
          ...reply,
          comments: children,
        }
        results.push(processedReply)
      }
    }

    return results
  }

  return {
    mainTweet,
    ancestors,
    // Start building from main tweet. The parentAuthor param was removed as it's no longer needed for logic.
    commentThreads: buildTree(mainTweetId),
    allowedAuthors: Array.from(allowedAuthors),
  }
}
