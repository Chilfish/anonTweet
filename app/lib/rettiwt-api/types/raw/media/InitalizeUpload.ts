/**
 * The raw data received after initalizing the upload process of a media file.
 *
 * @public
 */
export interface IMediaInitializeUploadResponse {
  media_id: number
  media_id_string: string
  expires_after_secs: number
}
