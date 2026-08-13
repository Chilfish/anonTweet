import type { ModelMessage } from 'ai'
import type { Route } from './+types/ai-test'
import { generateText } from 'ai'
import { data } from 'react-router'
import z from 'zod'
import { normalizeAIError } from '~/lib/ai-error'
import { models } from '~/lib/constants'
import { getProviderStrategy, getThinkingConfig } from '~/lib/providers'
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
    provider,
    baseUrl,
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
  const resolvedProvider = provider || modelConfig?.provider || 'google'

  try {
    const strategy = getProviderStrategy(resolvedProvider)
    const aiProvider = strategy.createSDKProvider(apiKey, baseUrl)

    const messages: ModelMessage[] = [
      { role: 'user', content: 'hello' },
    ]

    const thinkingConfig = getThinkingConfig(model, thinkingLevel)

    const response = await generateText({
      model: aiProvider(model),
      messages,
      temperature: 1,
      providerOptions: modelConfig
        ? strategy.buildProviderOptions(thinkingConfig, modelConfig)
        : {},
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
  catch (error: unknown) {
    console.error('AI Test Connection Failed:', error)
    return data({
      success: false,
      error: 'Failed to generate text',
      status: 500,
      message: 'Failed to generate text',
      cause: error instanceof Error ? error.message : '未知错误',
      aiError: normalizeAIError(error),
    })
  }
}
