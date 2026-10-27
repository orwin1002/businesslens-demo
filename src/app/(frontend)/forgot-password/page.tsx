import { forgotPassword } from '../actions'
import { Notice, type PageProps } from '../Notice'

export default async function ForgotPassword({ searchParams }: PageProps) {
  const sp = await searchParams
  return (
    <>
      <h1>Reset your password</h1>
      <Notice error={sp.error} />
      <form action={forgotPassword} className="stack narrow">
        <label>Email<input name="email" type="email" required /></label>
        <button>Email me a reset link</button>
      </form>
    </>
  )
}
