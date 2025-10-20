interface AvatarImgProps {
  src: string
  alt: string
  // width: number
  // height: number
}

export const AvatarImg = (props: AvatarImgProps) => <img {...props} />
