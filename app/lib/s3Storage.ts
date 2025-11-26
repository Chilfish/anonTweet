import {
  S3Client as _S3Client,
  DeleteObjectCommand,
  GetObjectCommand,
  NoSuchKey,
  PutObjectCommand,
} from '@aws-sdk/client-s3'
import { env } from './env.server'

// 辅助函数：将 ReadableStream 转换为字符串 (用于 getJson)
async function _streamToString(stream: ReadableStream): Promise<string> {
  const reader = stream.getReader()
  const chunks: Uint8Array[] = []
  while (true) {
    const { done, value } = await reader.read()
    if (done)
      break
    if (value)
      chunks.push(value)
  }
  // This is a more efficient way to concatenate Uint8Arrays and decode
  const concatenated = new Uint8Array(
    chunks.reduce((acc, chunk) => acc + chunk.length, 0),
  )
  let offset = 0
  for (const chunk of chunks) {
    concatenated.set(chunk, offset)
    offset += chunk.length
  }
  return new TextDecoder('utf-8').decode(concatenated)
}

/**
 * S3Client 配置接口
 */
interface S3ClientConfig {
  endpoint: string
  accessKeyId: string
  secretAccessKey: string
  bucketName: string
  /**
   * 你的 S3 存储桶绑定的公开访问域名 (例如 'https://static.your-domain.com')
   */
  publicUrl: string
}

/**
 * 一个用于与 Cloudflare S3 交互的客户端.
 * 支持 JSON 对象和公开访问的二进制文件.
 */
export class S3Client {
  private s3: _S3Client
  private bucketName: string
  private publicUrl: string

  constructor(config: S3ClientConfig) {
    if (!config.publicUrl) {
      throw new Error(
        'Configuration must include a \'publicUrl\' for the S3 bucket.',
      )
    }

    this.s3 = new _S3Client({
      region: 'auto',
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    })
    this.bucketName = config.bucketName
    // 确保 URL 末尾没有斜杠，以避免生成 '//'
    this.publicUrl = config.publicUrl.endsWith('/')
      ? config.publicUrl.slice(0, -1)
      : config.publicUrl
  }

  async getStreamingBlob(key: string) {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    })
    const response = await this.s3.send(command)
    if (!response.Body)
      throw new Error('Failed to get streaming blob')

    return response
  }

  async getJson<T>(key: string): Promise<T | null> {
    try {
      const body = await this.getStreamingBlob(key)
      const bodyStr = await body.Body!.transformToString('utf-8')

      return JSON.parse(bodyStr) as T
    }
    catch (error) {
      if (error instanceof NoSuchKey)
        return null
      throw error
    }
  }

  async setJson(key: string, value: any): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: JSON.stringify(value),
      ContentType: 'application/json',
    })
    await this.s3.send(command)
  }

  // --- 二进制文件操作 ---

  /**
   * 上传一个文件 (二进制).
   * @param {string} key - 对象的键 (例如, 'avatars/user-123.jpg').
   * @param { string | Uint8Array | Buffer} body - 文件内容.
   * @param {string} contentType - 文件的 MIME 类型 (例如, 'image/jpeg').
   */
  async uploadFile(
    key: string,
    body: string | Uint8Array | Buffer,
    contentType: string,
  ): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
    await this.s3.send(command)
  }

  /**
   * 根据对象的 key 直接构造其公开访问 URL.
   * @param {string} key - 对象的键.
   * @returns {string} 该对象的永久公开 URL.
   */
  getPublicUrl(key: string): string {
    // 直接拼接域名和 key
    return `${this.publicUrl}/${key}`
  }

  // --- 通用操作 ---

  /**
   * 从 S3 删除一个对象.
   * @param {string} key - 对象的键.
   */
  async delete(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    })
    await this.s3.send(command)
  }

  async deleteByPublicUrl(publicUrl: string): Promise<void> {
    const { pathname } = new URL(publicUrl)
    const key = pathname.slice(1)
    await this.delete(key)
  }
}

const config: S3ClientConfig = {
  endpoint: env.S3_ENDPOINT,
  accessKeyId: env.S3_ACCESS_KEY_ID,
  secretAccessKey: env.S3_SECRET_ACCESS_KEY,
  bucketName: env.S3_BUCKET_NAME,
  publicUrl: env.S3_PUBLIC_URL,
}

export const s3Client = new S3Client(config)

async function _handleUserProfileImage(
  userId: string,
  imageBuffer: Buffer,
): Promise<string> {
  const imageKey = `avatars/${userId}-${Date.now()}.jpg` // 加上时间戳避免 CDN 缓存问题

  // 上传图片
  await s3Client.uploadFile(imageKey, imageBuffer, 'image/jpeg')

  // 直接获取公开 URL
  const imageUrl = s3Client.getPublicUrl(imageKey)

  console.log(`User ${userId}'s new avatar URL: ${imageUrl}`)
  // 这个 URL 可以直接存入数据库，永久有效

  return imageUrl
}
