import Link from 'next/link'

import { AuthCard } from '@/components/site/AuthCard'
import type { PageProps } from '@/lib/params'
import { logIn } from '../actions'

export const metadata = { title: 'Log in' }

export default async function Login({ searchParams }: PageProps) {
  const sp = await searchParams
  return (
    <AuthCard title="Log in" message={sp.message} error={sp.error}>
      <form action={logIn} className="form">
        <input type="hidden" name="next" value={sp.next ?? ''} />
        <label>Email<input name="email" type="email" autoComplete="email" required /></label>
        <label>Password<input name="password" type="password" autoComplete="current-password" required /></label>
        <button className="btn">Log in</button>
      </form>
      <p className="small" style={{ marginTop: 16 }}>
        <Link href="/forgot-password">Forgot your password?</Link> · <Link href={`/signup${sp.next ? `?next=${encodeURIComponent(sp.next)}` : ''}`}>Create an account</Link>
      </p>
    </AuthCard>
  )
}
