import Link from 'next/link'

import { logIn } from '../actions'
import { Notice, type PageProps } from '../Notice'

export default async function Login({ searchParams }: PageProps) {
  const sp = await searchParams
  return (
    <>
      <h1>Sign in</h1>
      <Notice message={sp.message} error={sp.error} />
      <form action={logIn} className="stack narrow">
        <label>Email<input name="email" type="email" required /></label>
        <label>Password<input name="password" type="password" required /></label>
        <button>Sign in</button>
      </form>
      <p><Link href="/forgot-password">Forgot your password?</Link> · <Link href="/signup">Create an account</Link></p>
    </>
  )
}
