import type { HTMLAttributes } from 'react'
import styles from './skeleton.module.css'

export function Skeleton({ style }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={styles.skeleton} style={style} />
}
