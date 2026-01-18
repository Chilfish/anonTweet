import { access, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

export type CacheType = 'tweet' | 'user' | 'replies'

interface CacheArgs {
  id: string
  getter: () => Promise<any>
  type: CacheType
}

export async function getLocalCache<T>({ id, getter, type }: CacheArgs): Promise<T> {
  const dir = 'cache'
  const filePath = path.join(dir, `${type}-${id}.json`)

  const isFileExists = await access(filePath).then(() => true).catch(() => false)

  if (!isFileExists) {
    const data = await getter()
    await writeFile(filePath, JSON.stringify(data))
    return data
  }

  const fileContent = await readFile(filePath, 'utf8')
  const data = JSON.parse(fileContent)

  return data as T
}
