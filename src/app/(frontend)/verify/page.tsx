import { AuthCard } from '@/components/site/AuthCard'
import type { PageProps } from '@/lib/params'
import { verifyEmail } from '../actions'

// Confirming needs a button press, not just opening the link: email scanners and browsers
// sometimes open links on their own, which would use up the one-time token.
export default async function Verify({ searchParams }: PageProps) {
  const sp = await searchParams
  return (
    <AuthCard title="Confirm your email" error={sp.error}>
      <form action={verifyEmail} className="form">
        <input type="hidden" name="token" value={sp.token ?? ''} />
        <button className="btn">Confirm my email</button>
      </form>
    </AuthCard>
  )
}
