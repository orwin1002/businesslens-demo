import { AuthCard } from '@/components/site/AuthCard'
import type { PageProps } from '@/lib/params'
import { resetPassword } from '../actions'

export default async function ResetPassword({ searchParams }: PageProps) {
  const sp = await searchParams
  return (
    <AuthCard title="Choose a new password" error={sp.error}>
      <form action={resetPassword} className="form">
        <input type="hidden" name="token" value={sp.token ?? ''} />
        <label>New password<input name="password" type="password" minLength={8} required /></label>
        <button className="btn">Save password</button>
      </form>
    </AuthCard>
  )
}
