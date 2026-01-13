import type { GoogleGenerativeAIProviderOptions } from '@ai-sdk/google'
import type { ModelMessage } from 'ai'
import type { Route } from './+types/ai-test'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateText } from 'ai'
import { data } from 'react-router'
import z from 'zod'
import { getThinkingConfig } from '~/lib/AITranslation'
import { getTweetSchema } from '~/lib/validations/tweet'

export async function action({ request }: Route.ActionArgs) {
  const jsonData = await request.json()
  const submission = getTweetSchema.safeParse(jsonData)

  if (!submission.success || !submission.data) {
    return data({
      success: false,
      error: 'Invalid request',
      status: 400,
      message: `Invalid request data`,
      cause: z.flattenError(submission.error),
    })
  }

  const {
    tweetId: _id,
    apiKey,
    model,
    thinkingLevel,
  } = submission.data || {
    tweetId: '233',
    enableAITranslation: false,
    apiKey: '',
    model: '',
    translationGlossary: '233',
  }

  try {
    const gemini = createGoogleGenerativeAI({
      apiKey,
    })

    const messages: ModelMessage[] = [
      { role: 'user', content: 'hello' },
    ]

    const thinkingConfig = getThinkingConfig(model!, thinkingLevel)

    const response = await generateText({
      model: gemini(model!),
      messages,
      temperature: 1,
      providerOptions: {
        google: {
          thinkingConfig,
        } satisfies GoogleGenerativeAIProviderOptions,
      },
    })
    const text = response.text.trim()
    return data({
      success: true,
      data: {
        text,
        model,
        messages,
        temperature: 1,
        thinkingConfig,
      },
      status: 200,
      message: `Text generated successfully`,
    })
  }
  catch (error: any) {
    return data({
      success: false,
      error: 'Failed to generate text',
      status: 500,
      message: `Failed to generate text`,
      cause: error.message,
    })
  }
}
