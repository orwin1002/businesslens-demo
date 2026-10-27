import Link from 'next/link'

import { signUp } from '../actions'
import { Notice, type PageProps } from '../Notice'

export default async function SignUp({ searchParams }: PageProps) {
  const sp = await searchParams
  return (
    <>
      <h1>Create an account</h1>
      <Notice error={sp.error} />
      <form action={signUp} className="stack narrow">
        <label>Name<input name="name" required /></label>
        <label>Email<input name="email" type="email" required /></label>
        <label>Password<input name="password" type="password" minLength={8} required /></label>
        <button>Sign up</button>
      </form>
      <p>Already have an account? <Link href="/login">Sign in</Link></p>
    </>
  )
}
