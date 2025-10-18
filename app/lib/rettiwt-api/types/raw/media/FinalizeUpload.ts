/**
 * The raw data received after finalizing upload of a media file.
 *
 * @public
 */
export interface IMediaFinalizeUploadResponse {
  media_id: number
  media_id_string: string
  size: number
  expires_after_secs: number
  image: Image
}

interface Image {
  image_type: string
  w: number
  h: number
}
