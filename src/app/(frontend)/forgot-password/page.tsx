import { AuthCard } from '@/components/site/AuthCard'
import type { PageProps } from '@/lib/params'
import { forgotPassword } from '../actions'

export default async function ForgotPassword({ searchParams }: PageProps) {
  const sp = await searchParams
  return (
    <AuthCard title="Reset your password" error={sp.error}>
      <form action={forgotPassword} className="form">
        <label>Email<input name="email" type="email" required /></label>
        <button className="btn">Email me a reset link</button>
      </form>
    </AuthCard>
  )
}
