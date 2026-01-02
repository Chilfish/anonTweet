import pMap from 'p-map'
import { fetchTweet } from '~/lib/react-tweet/utils/get-tweet'

await pMap(
  Array.from({ length: 400 }, (_, i) => `2006561028054905${i}`),
  async id => await fetchTweet(id),
  { concurrency: 20 },
)
