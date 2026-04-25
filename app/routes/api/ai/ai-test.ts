import type { DeepSeekLanguageModelOptions } from '@ai-sdk/deepseek'
import type { GoogleGenerativeAIProviderOptions } from '@ai-sdk/google'
import type { ModelMessage } from 'ai'
import type { Route } from './+types/ai-test'
import { createDeepSeek } from '@ai-sdk/deepseek'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateText } from 'ai'
import { data } from 'react-router'
import z from 'zod'
import { getThinkingConfig } from '~/lib/AITranslation'
import { models } from '~/lib/constants'
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
    apiKey,
    model,
    thinkingLevel,
  } = submission.data

  if (!model || !apiKey) {
    return data({
      success: false,
      error: 'Missing parameters',
      status: 400,
      message: 'Model and API Key are required',
    })
  }

  const modelConfig = models.find(m => m.name === model)
  const provider = modelConfig?.provider || 'google'

  try {
    let aiProvider: any
    if (provider === 'google') {
      aiProvider = createGoogleGenerativeAI({
        apiKey,
      })
    }
    else {
      aiProvider = createDeepSeek({
        apiKey,
      })
    }

    const messages: ModelMessage[] = [
      { role: 'user', content: 'hello' },
    ]

    const thinkingConfig = getThinkingConfig(model, thinkingLevel)

    const response = await generateText({
      model: aiProvider(model),
      messages,
      temperature: 1,
      providerOptions: {
        ...(provider === 'google' ? {
          google: {
            thinkingConfig,
          } satisfies GoogleGenerativeAIProviderOptions,
        } : {}),
        ...(provider === 'deepseek' && model === 'deepseek-reasoner' ? {
          deepseek: {
            thinking: { type: 'enabled' },
          } satisfies DeepSeekLanguageModelOptions,
        } : {}),
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
    console.error('AI Test Connection Failed:', error)
    return data({
      success: false,
      error: 'Failed to generate text',
      status: 500,
      message: `Failed to generate text`,
      cause: error.message,
    })
  }
}
