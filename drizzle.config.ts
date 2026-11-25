import type { Config } from 'drizzle-kit'
import { env } from '~/lib/env.server'

export default {
  out: './drizzle',
  schema: './app/lib/database/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: env.DATABASE_URL!,
  },
} satisfies Config
