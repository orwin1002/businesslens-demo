import { verifyEmail } from '../actions'
import { Notice, type PageProps } from '../Notice'

// Confirming needs a button press, not just opening the link: email scanners and browsers
// sometimes open links on their own, which would use up the one-time token.
export default async function Verify({ searchParams }: PageProps) {
  const sp = await searchParams
  return (
    <>
      <h1>Confirm your email</h1>
      <Notice error={sp.error} />
      <form action={verifyEmail} className="stack narrow">
        <input type="hidden" name="token" value={sp.token ?? ''} />
        <button>Confirm my email</button>
      </form>
    </>
  )
}
