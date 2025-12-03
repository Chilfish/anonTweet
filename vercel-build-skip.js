// vercel/<project>/setting/git
// Ignored build step
// Run my Node script: node vercel-build.js

const { VERCEL_GIT_COMMIT_MESSAGE } = process.env

const shouldSkip = VERCEL_GIT_COMMIT_MESSAGE?.includes('[skip') ?? false

if (shouldSkip) {
  console.log('🛑 - Build cancelled')
  process.exit(0)
}
