import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  baseURL: new URL('/', import.meta.env.WXT_SITE_URL).href,
  plugins: [],
})
