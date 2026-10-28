'use server'

import { cookies } from 'next/headers.js'
import { redirect } from 'next/navigation.js'

import { currentUser, payloadClient } from '@/lib/payload'
import { indexFirms } from '@/lib/search'
import { passedTurnstile } from '@/lib/turnstile'

const TOKEN_COOKIE = 'payload-token'

const str = (form: FormData, key: string) => String(form.get(key) ?? '').trim()
const fail = (path: string, message: string): never =>
  redirect(`${path}${path.includes('?') ? '&' : '?'}error=${encodeURIComponent(message)}`)
const errorText = (err: unknown) => (err instanceof Error ? err.message : 'Something went wrong')

export async function signUp(form: FormData) {
  if (!(await passedTurnstile(form))) fail('/signup', 'Please complete the "Verify you are human" check.')
  const payload = await payloadClient()
  try {
    await payload.create({
      collection: 'users',
      data: { email: str(form, 'email'), password: str(form, 'password'), name: str(form, 'name'), role: 'member' },
      overrideAccess: false,
    })
  } catch (err) {
    fail('/signup', errorText(err))
  }
  redirect('/login?message=' + encodeURIComponent('Account created. Check your email and click the link to confirm it, then sign in.'))
}

export async function verifyEmail(form: FormData) {
  const payload = await payloadClient()
  const token = str(form, 'token')
  let ok = false
  try {
    ok = await payload.verifyEmail({ collection: 'users', token })
  } catch {
    ok = false
  }
  if (!ok) fail(`/verify?token=${token}`, "That link didn't work. It may have been used already, so try signing in.")
  redirect('/login?message=' + encodeURIComponent('Email confirmed. You can sign in now.'))
}

export async function logIn(form: FormData) {
  const payload = await payloadClient()
  let token: string | undefined
  let exp: number | undefined
  try {
    const result = await payload.login({
      collection: 'users',
      data: { email: str(form, 'email'), password: str(form, 'password') },
    })
    token = result.token
    exp = result.exp
  } catch (err) {
    fail('/login', errorText(err))
  }
  if (!token) fail('/login', 'Sign-in failed')
  ;(await cookies()).set(TOKEN_COOKIE, token!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: exp ? new Date(exp * 1000) : undefined,
  })
  redirect('/account')
}

export async function logOut() {
  ;(await cookies()).delete(TOKEN_COOKIE)
  redirect('/')
}

export async function forgotPassword(form: FormData) {
  const payload = await payloadClient()
  try {
    await payload.forgotPassword({ collection: 'users', data: { email: str(form, 'email') } })
  } catch (err) {
    fail('/forgot-password', errorText(err))
  }
  redirect('/login?message=' + encodeURIComponent('If that email has an account, a reset link is on its way.'))
}

export async function resetPassword(form: FormData) {
  const payload = await payloadClient()
  const token = str(form, 'token')
  try {
    await payload.resetPassword({
      collection: 'users',
      data: { token, password: str(form, 'password') },
      overrideAccess: true,
    })
  } catch (err) {
    fail(`/reset-password?token=${token}`, errorText(err))
  }
  redirect('/login?message=' + encodeURIComponent('Password changed. Sign in with your new password.'))
}

export async function postReview(form: FormData) {
  const user = await currentUser()
  const slug = str(form, 'slug')
  if (!user) redirect('/login')
  if (!(await passedTurnstile(form))) fail(`/firms/${slug}`, 'Please complete the "Verify you are human" check.')
  const payload = await payloadClient()
  try {
    await payload.create({
      collection: 'reviews',
      data: {
        firm: Number(str(form, 'firm')),
        author: user!.id,
        rating: Number(str(form, 'rating')),
        title: str(form, 'title'),
        body: str(form, 'body'),
        status: 'pending',
      },
      user: user!,
      overrideAccess: false,
    })
  } catch (err) {
    fail(`/firms/${slug}`, errorText(err))
  }
  redirect(`/firms/${slug}?message=` + encodeURIComponent('Thanks! Your review is waiting for approval. We sent you an email.'))
}

export async function sendTestEmail() {
  const user = await currentUser()
  if (!user) redirect('/login')
  const payload = await payloadClient()
  try {
    await payload.sendEmail({
      to: user!.email,
      subject: 'BusinessLens demo: test email',
      html: `<p>If you can read this, email sending works. Sent at ${new Date().toISOString()}.</p>`,
    })
  } catch (err) {
    fail('/status', 'Email failed: ' + errorText(err))
  }
  redirect('/status?message=' + encodeURIComponent(`Test email sent to ${user!.email}.`))
}

export async function reindexSearch() {
  const user = await currentUser()
  if (user?.role !== 'admin') fail('/status', 'Only admins can rebuild the search index')
  const payload = await payloadClient()
  try {
    const { docs } = await payload.find({ collection: 'firms', limit: 1000, pagination: false })
    await indexFirms(docs)
  } catch (err) {
    fail('/status', 'Search rebuild failed: ' + errorText(err))
  }
  redirect('/status?message=' + encodeURIComponent('Search index rebuilt.'))
}
