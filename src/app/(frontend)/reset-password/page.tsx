import { resetPassword } from '../actions'
import { Notice, type PageProps } from '../Notice'

export default async function ResetPassword({ searchParams }: PageProps) {
  const sp = await searchParams
  return (
    <>
      <h1>Choose a new password</h1>
      <Notice error={sp.error} />
      <form action={resetPassword} className="stack narrow">
        <input type="hidden" name="token" value={sp.token ?? ''} />
        <label>New password<input name="password" type="password" minLength={8} required /></label>
        <button>Save password</button>
      </form>
    </>
  )
}
