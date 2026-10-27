import Link from 'next/link'

import { payloadClient } from '@/lib/payload'
import type { PageProps } from '../Notice'

export default async function Verify({ searchParams }: PageProps) {
  const { token } = await searchParams
  let ok = false
  if (token) {
    try {
      const payload = await payloadClient()
      ok = await payload.verifyEmail({ collection: 'users', token })
    } catch {
      ok = false
    }
  }
  return ok ? (
    <>
      <h1>Email confirmed</h1>
      <p>Your account is ready. <Link href="/login">Sign in</Link></p>
    </>
  ) : (
    <>
      <h1>That link didn't work</h1>
      <p>It may have been used already. Try <Link href="/login">signing in</Link>.</p>
    </>
  )
}
