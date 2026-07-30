import { signIn } from '@/auth'
import { Card } from '@/components/ui/card'

export default function SignIn() {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-page">
      <Card className="w-80 text-center">
        <div className="mb-2 text-5xl">🌿</div>
        <h1 className="mb-1 text-2xl font-bold text-ink">Greenleaf</h1>
        <p className="mb-6 text-sm text-ink-2">Household utility splitting</p>
        <form action={async () => { 'use server'; await signIn('google', { redirectTo: '/' }) }}>
          <button
            type="submit"
            className="w-full rounded-xl bg-accent px-4 py-2.5 font-medium text-white shadow-glow hover:bg-accent-strong"
          >
            Sign in with Google
          </button>
        </form>
      </Card>
    </div>
  )
}
