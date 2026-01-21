import { env } from './env.server'

export type CacheType = 'tweet' | 'user' | 'replies'

interface CacheArgs<T> {
  id: string
  getter: () => Promise<T>
  type: CacheType
}

export async function getLocalCache<T>({ id, getter, type }: CacheArgs<T>): Promise<T> {
  if (!env.ENABLE_LOCAL_CACHE) {
    return await getter()
  }

  const dir = 'cache'
  const { access, readFile, writeFile } = await import('node:fs/promises')
  const path = await import('node:path')
  const filePath = path.join(dir, `${type}-${id}.json`)

  const isFileExists = await access(filePath).then(() => true).catch(() => false)

  if (!isFileExists) {
    const data = await getter()
    await writeFile(filePath, JSON.stringify(data))
    return data as T
  }

  const fileContent = await readFile(filePath, 'utf8')
  const data = JSON.parse(fileContent)

  return data as T
}
