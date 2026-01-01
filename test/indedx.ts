import type { ModelMessage } from 'ai'
import type { EnrichedTweet } from '~/lib/react-tweet'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateText } from 'ai'
import { getEnrichedTweet } from '~/lib/react-tweet'
import { restoreEntities, serializeForAI } from '~/lib/react-tweet/api-v2/entitytParser'

const gemini = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY,
})

const translationGlossary = `

`

async function translateText(text: string) {
  const systemPrompt = ''
  const systemMessage: ModelMessage = {
    role: 'system',
    content: systemPrompt,
  }

  const userMessage: ModelMessage = {
    role: 'user',
    content: `# Role Definition
    You are a professional translator specializing in social media content localization (Twitter/X). You are proficient in Internet slang, technical terminology, and maintaining the original emotional nuance of short texts.

    # Task
    Translate the provided tweet content from [Source Language] to Simplified Chinese.

    # Input Format
    1. **Source Text**: The tweet content to be translated.
    2. **Glossary**: A markdown formatted vocabulary list containing specific term mappings.

    # Critical Constraints & Entity Handling
    The source text has been pre-processed. You will see Entity Identifiers in the format \`<<__TYPE_INDEX__>>\` (e.g., \`<<__URL_0__>>\`, \`<<__MENTION_1__>>\`, \`<<__TAG_2__>>\`).

    **Strict Rules for Entities:**
    1. **NEVER translate Entity Identifiers.** You must preserve them exactly as they appear, including the double angle brackets and underscores.
    2. **NEVER remove Entity Identifiers.** All identifiers present in the source must appear in the translation.
    3. **Contextual Placement:** You MUST adjust the position of these identifiers within the sentence to strictly follow the grammar and word order of the [Target Language].
       - *Example (English to Chinese)*:
         - Source: "Check out <<__URL_0__>> for details."
         - Target: "请查看 <<__URL_0__>> 了解详情。" (Correctly moved)
         - Bad Target: "了解详情请查看。" (Missing identifier - FORBIDDEN)

    # Glossary Instructions
    - You will be provided with a Glossary context. You MUST strictly adhere to the translations defined in this glossary.
    - If a term in the text matches a key in the glossary, use the provided value without exception.
    - The glossary is provided in Markdown format.

    # Style Guidelines
    - Maintain the casual, concise, and engaging tone typical of Twitter.
    - Ensure the translation sounds native to the [Target Language] culture.
    - Avoid overly formal or robotic phrasing unless the source text is formal.

    # Input Data

    ## Glossary Reference

    ${translationGlossary}

    ## Source Text

    ${text}

    # Output
    Return ONLY the translated text string. Do not include explanations, quotes, or the original text.`,
  }

  const messages: ModelMessage[] = [systemMessage, userMessage]

  const response = await generateText({
    model: gemini('gemini-3-flash-preview'),
    messages,
    temperature: 1,
  })

  return response.text
}

async function autoTranslateTweet(tweet: EnrichedTweet) {
  const { entityMap, maskedText } = serializeForAI(tweet.entities)

  const translatedTextString = await translateText(maskedText)

  const translatedText = restoreEntities(translatedTextString, entityMap)

  console.log({ entityMap, maskedText, translatedText })
}

const tweet = await getEnrichedTweet('2006561028054905271')
if (tweet) {
  await autoTranslateTweet(tweet)
}
