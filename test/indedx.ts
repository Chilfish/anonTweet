import { generateEntityContext } from '~/lib/AITranslation'
import { restoreEntities, serializeForAI } from '~/lib/react-tweet'
import { getEnrichedTweet } from '~/lib/react-tweet/utils/get-tweet'

const tweet = await getEnrichedTweet('2006262603186835664')
if (!tweet) {
  process.exit(1)
}

const data = serializeForAI(tweet.entities)

const entities = restoreEntities(data.maskedText, data.entityMap, tweet.entities)

const text = generateEntityContext(data.entityMap)

console.log(data, entities, text)
