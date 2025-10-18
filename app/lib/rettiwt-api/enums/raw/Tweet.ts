/**
 * The different types of search results when searching for tweets.
 *
 * @public
 */
export enum RawTweetSearchResultType {
  LATEST = 'Latest',
  TOP = 'Top',
}

/**
 * The different types of sorting options when fetching replies to tweets.
 *
 * @public
 */
export enum RawTweetRepliesSortType {
  RELEVACE = 'Relevance',
  LATEST = 'Recency',
  LIKES = 'Likes',
}
