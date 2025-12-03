import type { ActionFunctionArgs } from 'react-router'
// 假设类型定义依然保留在 types/bili 中，或者你可以直接写在这里
import type { CreateDynResult, UploadImageResult } from '~/types/bili'
import axios from 'axios'
import { data } from 'react-router'

// 基础配置
const API_BASE = 'https://api.bilibili.com'
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

// 辅助函数：从 Cookie 字符串提取值
function getCookieValue(cookie: string, key: string) {
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${key}=([^;]*)`))
  return match?.[1] || ''
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData()
  const title = formData.get('title') as string
  const content = formData.get('content') as string
  const files = formData.getAll('images') as File[]

  // TODO: 从db中获取用户存入的cookie
  // bili_jct=asdd;DedeUserID=1234567890;
  const cookie = (formData.get('cookie') || '') as string
  const csrf = getCookieValue(cookie, 'bili_jct')
  const uid = getCookieValue(cookie, 'DedeUserID')

  // 基础校验
  if (!content)
    return { error: 'Content is required' }
  if (!cookie || !csrf || !uid)
    return { error: 'Invalid Configuration: Missing Cookie/CSRF/UID' }

  // 创建轻量级 Axios 实例
  const client = axios.create({
    baseURL: API_BASE,
    headers: {
      'User-Agent': USER_AGENT,
      'Cookie': cookie,
      'Origin': 'https://t.bilibili.com',
      'Referer': 'https://t.bilibili.com/',
    },
    withCredentials: true,
  })

  // 统一错误处理包装
  const requestApi = async function<T>(method: 'post' | 'postForm', url: string, data: any) {
    const res = await client[method](url, data)
    const code = Number(res.data?.code) ?? -1
    // Cookie 已失效，没有登录信息
    if (code === -101) {
      throw new Error('Cookie 已失效，没有登录信息', {
        cause: 401,
      })
    }

    if (code !== 0) {
      throw new Error(`发布失败：${JSON.stringify(res.data)}`, {
        cause: res.data,
      })
    }
    return res.data.data as T
  }

  try {
    // 1. 并发上传图片
    // 过滤掉空文件（如果用户没选图片）
    const validFiles = files.filter(f => f.size > 0)

    const uploadPromises = validFiles.map((file) => {
      const form = new FormData()
      form.append('file_up', file)
      form.append('biz', 'new_dyn')
      form.append('category', 'daily')
      form.append('csrf', csrf)
      return requestApi<UploadImageResult>('postForm', '/x/dynamic/feed/draw/upload_bfs', form)
    })

    const uploadedImages = await Promise.all(uploadPromises)

    // 2. 构造动态 Payload
    const uploadId = `${uid}_${Math.floor(Date.now() / 1000)}_${Math.floor(1000 + Math.random() * 9000)}`

    const payload = {
      dyn_req: {
        content: { contents: [{ raw_text: content, type: 1, biz_id: '' }], title },
        pics: uploadedImages.map(img => ({
          img_src: img.image_url,
          img_width: img.image_width,
          img_height: img.image_height,
          img_size: img.img_size,
        })),
        scene: 2,
        upload_id: uploadId,
        meta: { app_meta: { from: 'create.dynamic.web', mobi_app: 'web' } },
        option: { aigc: 0, pic_mode: 0, up_choose_comment: 0, close_comment: 0 },
      },
    }

    // 3. 发布动态 (注意 CSRF 必须在 query 中)
    const result = await requestApi<CreateDynResult>(
      'post',
      `/x/dynamic/feed/create/dyn?csrf=${csrf}&platform=web`,
      payload,
    )

    console.log(`Published: ${result.dyn_id_str}`)
    return data(result)
  }
  catch (error: any) {
    console.error('Publish Failed:', error)
    return { error: error.message || 'Service Error' }
  }
}
