import type { EnrichedTweet, RawUser } from '~/types'
import { useParams } from 'react-router'
import useSWR from 'swr/immutable'
import { ProfileHeader } from '~/components/profile/ProfileHeader'
import { MyTweet } from '~/components/tweet/Tweet'
import { TweetHeader } from '~/components/tweet/TweetHeader'
import { fetcher } from '~/lib/fetcher'

async function getProfile(username: string) {
  if (!username)
    return null

  const { data } = await fetcher.get<RawUser | null>(`/api/user/get/${username}`)
  return data
}

async function getTimeline(username: string) {
  if (!username)
    return []

  const { data } = await fetcher.get<EnrichedTweet[]>(`/api/user/timeline/${username}`)
  return data
}

function TimelineTweets({ username}: { username: string }) {
  const { data: tweets, isLoading } = useSWR(
    [username, 'timeline'],
    () => getTimeline(username),
  )

  if (isLoading)
    return <Loading />
  if (!tweets)
    return null

  return (
    <div className="space-y-4">
      {tweets.map(tweet => (
        <MyTweet
          key={tweet.id_str}
          mainTweetId={tweet.id_str}
          tweets={[tweet]}
          containerClassName="sm:max-w-full! mb-1"
        />
      ))}
    </div>
  )
}

function UserNotFound({ username }: { username?: string }) {
  return (
    <div className="bg-card px-4 py-6 flex flex-col items-center justify-center rounded-lg">
      <div className="text-muted-foreground animate-pulse font-medium">
        @
        {username}
        {' '}
        用户不存在
      </div>
    </div>
  )
}

function Loading() {
  return (
    <div className="flex items-center justify-center py-2">
      <div className="text-muted-foreground animate-pulse font-medium">加载中...</div>
    </div>
  )
}

export default function ProfilePage() {
  const { username } = useParams()

  const { data: user, isLoading } = useSWR(
    [username, 'profile'],
    () => getProfile(username!),
  )

  if (isLoading) {
    return <Loading />
  }

  return (
    <>
      <TweetHeader />
      {user ? (
        <div className="bg-background border-x border-border rounded max-w-[600px]">
          <ProfileHeader user={user}>
            <TimelineTweets username={user.userName} />
          </ProfileHeader>
        </div>
      ) : (
        <UserNotFound username={username} />
      )}
    </>
  )
}
