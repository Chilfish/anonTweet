import type { AxiosRequestConfig } from 'axios'

// import fs from 'node:fs'
import FormData from 'form-data'

/**
 * Collection of requests related to media.
 *
 * @public
 */
export class MediaRequests {
  /**
   * @param id - The allocated id of the media item to be uploaded.
   * @param media - The media item to upload.
   */
  public static appendUpload(id: string, media: string | ArrayBuffer): AxiosRequestConfig {
    const data = new FormData()
    // data.append('media', typeof media === 'string' ? fs.createReadStream(media) : Buffer.from(media))
    return {
      method: 'post',
      headers: { referer: 'https://x.com' },
      url: 'https://upload.x.com/i/media/upload.json',
      params: {
        command: 'APPEND',
        media_id: id,
        segment_index: 0,
      },
      data,
    }
  }

  /**
   * @param id - The allocated id of the media item.
   */
  public static finalizeUpload(id: string): AxiosRequestConfig {
    return {
      method: 'post',
      headers: { referer: 'https://x.com' },
      url: 'https://upload.x.com/i/media/upload.json',
      params: {
        command: 'FINALIZE',
        media_id: id,
      },
    }
  }

  /**
   * @param size - The size (in bytes) of the media item to be uploaded.
   */
  public static initializeUpload(size: number): AxiosRequestConfig {
    return {
      method: 'post',
      headers: { referer: 'https://x.com' },
      url: 'https://upload.x.com/i/media/upload.json',
      params: {
        command: 'INIT',
        total_bytes: size,
      },
    }
  }
}
