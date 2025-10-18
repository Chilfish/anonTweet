/**
 * The raw data received when fetching the URL to a live video stream.
 *
 * @public
 */
export interface IMediaLiveVideoStreamResponse {
  source: Source
  sessionId: string
  chatToken: string
  lifecycleToken: string
  shareUrl: string
}

interface Source {
  location: string
  noRedirectPlaybackUrl: string
  status: string
  streamType: string
}
