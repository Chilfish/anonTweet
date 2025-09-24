interface MediaImgProps {
  src: string
  alt: string
  className?: string
  draggable?: boolean
}

export const MediaImg = (props: MediaImgProps) => <img {...props} />
