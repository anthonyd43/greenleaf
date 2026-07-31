import { ArrowRight } from 'lucide-react'
import { signIn } from '@/auth'
import { LeafLogo } from '@/components/ui/leaf-logo'
import { SigninArt } from '@/components/signin-art'
import { pillSolid } from '@/components/ui/classes'

export default function SignIn() {
  return (
    <div className="fixed inset-0 z-50 flex overflow-auto bg-page max-rail:flex-col">
      <div className="flex flex-1 items-center justify-center border-r border-[rgba(148,163,184,0.08)] bg-sidebar max-rail:hidden">
        <SigninArt />
      </div>
      <div className="flex flex-1 flex-col items-start justify-center gap-6 px-24 max-rail:flex-none max-rail:px-7 max-rail:py-12">
        <LeafLogo size={52} gradientId="leafGradSignin" veinColor="#141624" />
        <h1 className="text-[40px] font-semibold leading-[1.15] tracking-[-0.02em] text-ink">
          Split the bills,
          <br />
          keep the peace.
        </h1>
        <p className="max-w-[380px] text-[15px] text-ink-2">
          Greenleaf tracks your household&apos;s utilities, prorates for time away, and settles
          everyone up over Venmo.
        </p>
        <form action={async () => { 'use server'; await signIn('google', { redirectTo: '/' }) }}>
          <button type="submit" className={`${pillSolid} px-7 py-3.5 text-[15px]`}>
            Sign in with Google
            <ArrowRight size={16} strokeWidth={2} />
          </button>
        </form>
        <p className="text-xs text-ink-3">
          Invite-only — ask a housemate to add your email in Settings
        </p>
      </div>
    </div>
  )
}
