import Link from 'next/link'

import { AuthCard } from '@/components/site/AuthCard'
import type { PageProps } from '@/lib/params'
import { turnstileSiteKey } from '@/lib/turnstile'
import { signUp } from '../actions'
import { Turnstile } from '@/components/site/Turnstile'

export const metadata = { title: 'Create an account' }

export default async function SignUp({ searchParams }: PageProps) {
  const sp = await searchParams
  return (
    <AuthCard title="Create an account" intro="Free. You need an account to write reviews, vote and claim a company profile." error={sp.error}>
      <form action={signUp} className="form">
        <input type="hidden" name="next" value={sp.next ?? ''} />
        <label>Name (shown on your reviews)<input name="name" autoComplete="name" required /></label>
        <label>Email<input name="email" type="email" autoComplete="email" required /></label>
        <label>Password<input name="password" type="password" minLength={8} autoComplete="new-password" required /></label>
        <Turnstile siteKey={turnstileSiteKey()} />
        <button className="btn">Sign up</button>
      </form>
      <p className="small" style={{ marginTop: 16 }}>Already have an account? <Link href="/login">Log in</Link></p>
    </AuthCard>
  )
}
