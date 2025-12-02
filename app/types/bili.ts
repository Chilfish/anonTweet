// src/lib/bilibili/types.ts

export interface BilibiliConfig {
  cookie: string // 包含 SESSDATA, bili_jct, DedeUserID
}

export interface UploadImageResult {
  image_url: string
  image_width: number
  image_height: number
  img_size: number
  ai_gen_pic: number
}

export interface CreateDynResult {
  dyn_id_str: string
  dyn_id: number
}

export interface DynContentItem {
  raw_text: string
  type: number // 1: 文本
  biz_id: string
}

export interface DynPicItem {
  img_src: string
  img_width: number
  img_height: number
  img_size: number
  ai_gen_pic: number
}

export interface CreateDynPayload {
  dyn_req: {
    content: {
      contents: DynContentItem[]
      title?: string
    }
    pics: DynPicItem[]
    scene: number // 2: 图文
    upload_id: string
    meta: {
      app_meta: {
        from: string
        mobi_app: string
      }
    }
    option: {
      aigc: number
      pic_mode: number
      up_choose_comment: number
      close_comment: number
    }
  }
}

// 抽象 HTTP 客户端接口 (ISP/DIP)
export interface IHttpClient {
  post: <T>(url: string, data: any, config?: any) => Promise<T>
  postForm: <T>(url: string, data: FormData, config?: any) => Promise<T>
}
