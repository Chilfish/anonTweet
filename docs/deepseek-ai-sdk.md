# DeepSeek Provider

The [DeepSeek](https://www.deepseek.com) provider offers access to powerful language models through the DeepSeek API.

API keys can be obtained from the [DeepSeek Platform](https://platform.deepseek.com/api_keys).

## Setup

The DeepSeek provider is available via the `@ai-sdk/deepseek` module. You can install it with:

<Tabs items={['pnpm', 'npm', 'yarn', 'bun']}>
<Tab>
<Snippet text="pnpm add @ai-sdk/deepseek" dark />
</Tab>
<Tab>
<Snippet text="npm install @ai-sdk/deepseek" dark />
</Tab>
<Tab>
<Snippet text="yarn add @ai-sdk/deepseek" dark />
</Tab>
<Tab>
<Snippet text="bun add @ai-sdk/deepseek" dark />
</Tab>
</Tabs>

## Provider Instance

You can import the default provider instance `deepseek` from `@ai-sdk/deepseek`:

```ts
import { deepseek } from '@ai-sdk/deepseek'
```

For custom configuration, you can import `createDeepSeek` and create a provider instance with your settings:

```ts
import { createDeepSeek } from '@ai-sdk/deepseek'

const deepseek = createDeepSeek({
  apiKey: process.env.DEEPSEEK_API_KEY ?? '',
})
```

You can use the following optional settings to customize the DeepSeek provider instance:

- **baseURL** _string_

  Use a different URL prefix for API calls.
  The default prefix is `https://api.deepseek.com`.

- **apiKey** _string_

  API key that is being sent using the `Authorization` header. It defaults to
  the `DEEPSEEK_API_KEY` environment variable.

- **headers** _Record&lt;string,string&gt;_

  Custom headers to include in the requests.

- **fetch** _(input: RequestInfo, init?: RequestInit) => Promise&lt;Response&gt;_

  Custom [fetch](https://developer.mozilla.org/en-US/docs/Web/API/fetch) implementation.

## Language Models

You can create language models using a provider instance:

```ts
import { deepseek } from '@ai-sdk/deepseek'
import { generateText } from 'ai'

const { text } = await generateText({
  model: deepseek('deepseek-chat'),
  prompt: 'Write a vegetarian lasagna recipe for 4 people.',
})
```

You can also use the `.chat()` or `.languageModel()` factory methods:

```ts
const model = deepseek.chat('deepseek-chat')
// or
const model = deepseek.languageModel('deepseek-chat')
```

DeepSeek language models can be used in the `streamText` function
(see [AI SDK Core](/docs/ai-sdk-core)).

The following optional provider options are available for DeepSeek models:

- `thinking` _object_

  Optional. Controls thinking mode (chain-of-thought reasoning). You can enable thinking mode either by using the `deepseek-reasoner` model or by setting this option.
  - `type`: `'enabled' | 'disabled'` - Enable or disable thinking mode.

```ts highlight="7-11"
import type { DeepSeekLanguageModelOptions } from '@ai-sdk/deepseek'
import { deepseek } from '@ai-sdk/deepseek'
import { generateText } from 'ai'

const { text, reasoning } = await generateText({
  model: deepseek('deepseek-chat'),
  prompt: 'How many "r"s are in the word "strawberry"?',
  providerOptions: {
    deepseek: {
      thinking: { type: 'enabled' },
    } satisfies DeepSeekLanguageModelOptions,
  },
})
```

### Reasoning

DeepSeek has reasoning support for the `deepseek-reasoner` model. The reasoning is exposed through streaming:

```ts
import { deepseek } from '@ai-sdk/deepseek'
import { streamText } from 'ai'

const result = streamText({
  model: deepseek('deepseek-reasoner'),
  prompt: 'How many "r"s are in the word "strawberry"?',
})

for await (const part of result.fullStream) {
  if (part.type === 'reasoning') {
    // This is the reasoning text
    console.log('Reasoning:', part.text)
  }
  else if (part.type === 'text') {
    // This is the final answer
    console.log('Answer:', part.text)
  }
}
```

See [AI SDK UI: Chatbot](/docs/ai-sdk-ui/chatbot#reasoning) for more details
on how to integrate reasoning into your chatbot.

### Cache Token Usage

DeepSeek provides context caching on disk technology that can significantly reduce token costs for repeated content. You can access the cache hit/miss metrics through the `providerMetadata` property in the response:

```ts
import { deepseek } from '@ai-sdk/deepseek'
import { generateText } from 'ai'

const result = await generateText({
  model: deepseek('deepseek-chat'),
  prompt: 'Your prompt here',
})

console.log(result.providerMetadata)
// Example output: { deepseek: { promptCacheHitTokens: 1856, promptCacheMissTokens: 5 } }
```

The metrics include:

- `promptCacheHitTokens`: Number of input tokens that were cached
- `promptCacheMissTokens`: Number of input tokens that were not cached

<Note>
  For more details about DeepSeek's caching system, see the [DeepSeek caching
  documentation](https://api-docs.deepseek.com/guides/kv_cache#checking-cache-hit-status).
</Note>

思考模式
DeepSeek 模型支持思考模式：在输出最终回答之前，模型会先输出一段思维链内容，以提升最终答案的准确性。

思考模式开关与思考强度控制
控制参数（OpenAI 格式） 控制参数（Anthropic 格式）
思考模式开关(1) {"thinking": {"type": "enabled/disabled"}}
思考强度控制(2)(3) {"reasoning_effort": "high/max"} {"output_config": {"effort": "high/max"}}
(1) 默认思考开关为 enabled
(2) 思考模式下，对普通请求，默认 effort 为 high；对一些复杂 Agent 类请求（如 Claude Code、OpenCode），effort 自动设置为 max
(3) 思考模式下，出于兼容考虑 low、medium 会映射为 high, xhigh 会映射为 max
