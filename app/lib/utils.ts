import type { ClassValue } from 'clsx'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function extractTweetId(input: string): string | null {
  // Remove whitespace
  const trimmed = input.trim()

  // If it's already just a tweet ID (numeric string)
  if (/^\d+$/.test(trimmed)) {
    return trimmed
  }

  // Twitter URL patterns
  const patterns = [
    // Standard twitter.com URLs
    /(?:https?:\/\/)?(?:www\.)?twitter\.com\/\w+\/status\/(\d+)/i,
    // x.com URLs
    /(?:https?:\/\/)?(?:www\.)?x\.com\/\w+\/status\/(\d+)/i,
    // Mobile URLs
    /(?:https?:\/\/)?(?:mobile\.)?twitter\.com\/\w+\/status\/(\d+)/i,
    /(?:https?:\/\/)?(?:mobile\.)?x\.com\/\w+\/status\/(\d+)/i,
  ]

  for (const pattern of patterns) {
    const match = trimmed.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  return null
}
