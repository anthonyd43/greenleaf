import { auth } from '@/auth'

export async function requireUser(): Promise<{ email: string }> {
  const session = await auth()
  const email = session?.user?.email
  if (!email) throw new Error('unauthorized')
  return { email: email.toLowerCase() }
}
