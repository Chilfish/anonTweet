import type { Command } from 'commander'
import type { Rettiwt } from '../Rettiwt'

import { createCommand } from 'commander'
import { RawAnalyticsGranularity, RawAnalyticsMetric } from '../enums/raw/Analytics'
import { output } from '../helper/CliUtils'

/**
 * Creates a new 'user' command which uses the given Rettiwt instance.
 *
 * @param rettiwt - The Rettiwt instance to use.
 * @returns The created 'user' command.
 */
function createUserCommand(rettiwt: Rettiwt): Command {
  // Creating the 'user' command
  const user = createCommand('user').description('Access resources related to users')

  // Affiliates
  user.command('affiliates')
    .description('Fetch the list of users who affiliated to the given user')
    .argument('<id>', 'The id of the user')
    .argument('[count]', 'The number of affiliates to fetch')
    .argument('[cursor]', 'The cursor to the batch of affiliates to fetch')
    .action(async (id: string, count?: string, cursor?: string) => {
      try {
        const users = await rettiwt.user.affiliates(id, count ? Number.parseInt(count) : undefined, cursor)
        output(users)
      }
      catch (error) {
        output(error)
      }
    })

  // Analytics
  user.command('analytics')
    .description('Fetch the analytics of the logged-in user (premium accounts only)')
    .option('-f, --from-time <string>', 'The start time for fetching analytics')
    .option('-t, --to-time <string>', 'The end time for fetching analytics')
    .option(
      '-g, --granularity <string>',
      'The granularity of the analytics data. Defaults to daily. Check https://rishikant181.github.io/Rettiwt-API/enums/RawAnalyticsGranularity.html for granularity options',
    )
    .option(
      '-m, --metrics <string>',
      'Comma-separated list of metrics required. Check https://rishikant181.github.io/Rettiwt-API/enums/RawAnalyticsMetric.html for available metrics',
    )
    .option(
      '-v, --verified-followers',
      'Whether to include verified follower count and relationship counts in the response. Defaults to true',
    )
    .action(async (options?: UserAnalyticsOptions) => {
      try {
        const analytics = await rettiwt.user.analytics(
          options?.fromTime ? new Date(options.fromTime) : undefined,
          options?.toTime ? new Date(options.toTime) : undefined,
          options?.granularity
            ? RawAnalyticsGranularity[options.granularity as keyof typeof RawAnalyticsGranularity]
            : undefined,
          options?.metrics
            ? options.metrics
                .split(',')
                .map(item => RawAnalyticsMetric[item as keyof typeof RawAnalyticsMetric])
            : undefined,
          options?.verifiedFollowers,
        )
        output(analytics)
      }
      catch (error) {
        output(error)
      }
    })

  user.command('bookmarks')
    .description('Fetch your list of bookmarks')
    .argument('[count]', 'The number of bookmarks to fetch')
    .argument('[cursor]', 'The cursor to the batch of bookmarks to fetch')
    .action(async (count?: string, cursor?: string) => {
      try {
        const bookmarks = await rettiwt.user.bookmarks(count ? Number.parseInt(count) : undefined, cursor)
        output(bookmarks)
      }
      catch (error) {
        output(error)
      }
    })

  // Details
  user.command('details')
    .description('Fetch the details of the user with the given id/username')
    .argument('<id>', 'The username/id of the user whose details are to be fetched')
    .action(async (id: string) => {
      try {
        // Getting the different IDs
        const ids: string[] = id.split(',')

        // If single ID given
        if (ids.length <= 1) {
          const details = await rettiwt.user.details(ids[0])
          output(details)
        }
        // If multiple IDs given
        else {
          const details = await rettiwt.user.details(ids)
          output(details)
        }
      }
      catch (error) {
        output(error)
      }
    })

  // Follow
  user.command('follow')
    .description('Follow a user')
    .argument('<id>', 'The user to follow')
    .action(async (id: string) => {
      try {
        const result = await rettiwt.user.follow(id)
        output(result)
      }
      catch (error) {
        output(error)
      }
    })

  // Followed
  user.command('followed')
    .description('Fetch your followed feed')
    .argument('[cursor]', 'The cursor to the batch of feed items to fetch')
    .action(async (cursor?: string) => {
      try {
        const tweets = await rettiwt.user.followed(cursor)
        output(tweets)
      }
      catch (error) {
        output(error)
      }
    })

  // Followers
  user.command('followers')
    .description('Fetch the list of users who follow the given user')
    .argument('<id>', 'The id of the user')
    .argument('[count]', 'The number of followers to fetch')
    .argument('[cursor]', 'The cursor to the batch of followers to fetch')
    .action(async (id: string, count?: string, cursor?: string) => {
      try {
        const users = await rettiwt.user.followers(id, count ? Number.parseInt(count) : undefined, cursor)
        output(users)
      }
      catch (error) {
        output(error)
      }
    })

  // Following
  user.command('following')
    .description('Fetch the list of users who are followed by the given user')
    .argument('<id>', 'The id of the user')
    .argument('[count]', 'The number of following to fetch')
    .argument('[cursor]', 'The cursor to the batch of following to fetch')
    .action(async (id: string, count?: string, cursor?: string) => {
      try {
        const users = await rettiwt.user.following(id, count ? Number.parseInt(count) : undefined, cursor)
        output(users)
      }
      catch (error) {
        output(error)
      }
    })

  // Highlights
  user.command('highlights')
    .description('Fetch the list of highlighted tweets of the given user')
    .argument('<id>', 'The id of the user')
    .argument('[count]', 'The number of highlighted tweets to fetch')
    .argument('[cursor]', 'The cursor to the batch of highlights to fetch')
    .action(async (id: string, count?: string, cursor?: string) => {
      try {
        const tweets = await rettiwt.user.highlights(id, count ? Number.parseInt(count) : undefined, cursor)
        output(tweets)
      }
      catch (error) {
        output(error)
      }
    })

  // Likes
  user.command('likes')
    .description('Fetch your list of liked tweet')
    .argument('[count]', 'The number of liked tweets to fetch')
    .argument('[cursor]', 'The cursor to the batch of liked tweets to fetch')
    .action(async (count?: string, cursor?: string) => {
      try {
        const tweets = await rettiwt.user.likes(count ? Number.parseInt(count) : undefined, cursor)
        output(tweets)
      }
      catch (error) {
        output(error)
      }
    })

  // Lists
  user.command('lists')
    .description('Fetch your lists')
    .argument('[count]', 'The number of lists to fetch')
    .argument('[cursor]', 'The cursor to the batch of lists to fetch')
    .action(async (count?: string, cursor?: string) => {
      try {
        const lists = await rettiwt.user.lists(count ? Number.parseInt(count) : undefined, cursor)
        output(lists)
      }
      catch (error) {
        output(error)
      }
    })

  // Media
  user.command('media')
    .description('Fetch the media timeline the given user')
    .argument('<id>', 'The id of the user')
    .argument('[count]', 'The number of media to fetch')
    .argument('[cursor]', 'The cursor to the batch of media to fetch')
    .action(async (id: string, count?: string, cursor?: string) => {
      try {
        const media = await rettiwt.user.media(id, count ? Number.parseInt(count) : undefined, cursor)
        output(media)
      }
      catch (error) {
        output(error)
      }
    })

  // Recommended
  user.command('recommended')
    .description('Fetch your recommended feed')
    .argument('[cursor]', 'The cursor to the batch of feed items to fetch')
    .action(async (cursor?: string) => {
      try {
        const tweets = await rettiwt.user.recommended(cursor)
        output(tweets)
      }
      catch (error) {
        output(error)
      }
    })

  // Replies
  user.command('replies')
    .description('Fetch the replies timeline the given user')
    .argument('<id>', 'The id of the user')
    .argument('[count]', 'The number of replies to fetch')
    .argument('[cursor]', 'The cursor to the batch of replies to fetch')
    .action(async (id: string, count?: string, cursor?: string) => {
      try {
        const replies = await rettiwt.user.replies(id, count ? Number.parseInt(count) : undefined, cursor)
        output(replies)
      }
      catch (error) {
        output(error)
      }
    })

  // Timeline
  user.command('timeline')
    .description('Fetch the tweets timeline the given user')
    .argument('<id>', 'The id of the user')
    .argument('[count]', 'The number of tweets to fetch')
    .argument('[cursor]', 'The cursor to the batch of tweets to fetch')
    .action(async (id: string, count?: string, cursor?: string) => {
      try {
        const tweets = await rettiwt.user.timeline(id, count ? Number.parseInt(count) : undefined, cursor)
        output(tweets)
      }
      catch (error) {
        output(error)
      }
    })

  // Unfollow
  user.command('unfollow')
    .description('Unfollow a user')
    .argument('<id>', 'The user to unfollow')
    .action(async (id: string) => {
      try {
        const result = await rettiwt.user.unfollow(id)
        output(result)
      }
      catch (error) {
        output(error)
      }
    })

  return user
}

/**
 * The options for fetching user analytics.
 */
interface UserAnalyticsOptions {
  fromTime?: string
  toTime?: string
  granularity?: string
  metrics?: string
  verifiedFollowers?: boolean
}

export default createUserCommand
