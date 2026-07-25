import NextAuth from 'next-auth'
import { authConfig } from './auth.config'
import { isAllowedEmail } from './lib/allowlist'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    signIn({ user }) {
      return isAllowedEmail(user.email)
    },
  },
})
