'use server'

import { cookies } from 'next/headers.js'
import { redirect } from 'next/navigation.js'

import { hasRole } from '@/access'
import { currentUser, payloadClient } from '@/lib/payload'
import { rebuildIndex } from '@/lib/search'
import { passedTurnstile } from '@/lib/turnstile'

const TOKEN_COOKIE = 'payload-token'

const str = (form: FormData, key: string) => String(form.get(key) ?? '').trim()
const num = (form: FormData, key: string) => Number(str(form, key)) || 0
const withMsg = (path: string, key: 'message' | 'error', text: string) => {
  const [base, hash] = path.split('#')
  return `${base}${base.includes('?') ? '&' : '?'}${key}=${encodeURIComponent(text)}${hash ? '#' + hash : ''}`
}
const fail = (path: string, message: string): never => redirect(withMsg(path, 'error', message))
const done = (path: string, message: string): never => redirect(withMsg(path, 'message', message))
const errorText = (err: unknown) => (err instanceof Error ? err.message : 'Something went wrong')
// Only same-site paths are allowed as a "go back to" target.
const safePath = (p: string, fallback: string) => (p.startsWith('/') && !p.startsWith('//') ? p : fallback)
const idOf = (v: unknown) => (typeof v === 'object' && v ? (v as { id: number }).id : (v as number))

async function needUser(next: string) {
  const user = await currentUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}&message=${encodeURIComponent('Please sign in first.')}`)
  return user!
}

// ---------- Accounts ----------

export async function signUp(form: FormData) {
  const next = safePath(str(form, 'next'), '/account')
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
  redirect(`/login?next=${encodeURIComponent(next)}&message=` + encodeURIComponent('Account created. Check your email and click the link to confirm it, then sign in.'))
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
  done('/login', 'Email confirmed. You can sign in now.')
}

export async function logIn(form: FormData) {
  const next = safePath(str(form, 'next'), '/account')
  const payload = await payloadClient()
  let token: string | undefined
  let exp: number | undefined
  try {
    const result = await payload.login({ collection: 'users', data: { email: str(form, 'email'), password: str(form, 'password') } })
    token = result.token
    exp = result.exp
  } catch (err) {
    fail(`/login?next=${encodeURIComponent(next)}`, errorText(err))
  }
  if (!token) fail('/login', 'Sign-in failed')
  ;(await cookies()).set(TOKEN_COOKIE, token!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: exp ? new Date(exp * 1000) : undefined,
  })
  redirect(next)
}

export async function forgotPassword(form: FormData) {
  const payload = await payloadClient()
  try {
    await payload.forgotPassword({ collection: 'users', data: { email: str(form, 'email') } })
  } catch (err) {
    fail('/forgot-password', errorText(err))
  }
  done('/login', 'If that email has an account, a reset link is on its way.')
}

export async function resetPassword(form: FormData) {
  const payload = await payloadClient()
  const token = str(form, 'token')
  try {
    await payload.resetPassword({ collection: 'users', data: { token, password: str(form, 'password') }, overrideAccess: true })
  } catch (err) {
    fail(`/reset-password?token=${token}`, errorText(err))
  }
  done('/login', 'Password changed. Sign in with your new password.')
}

// ---------- Reviews ----------

export async function postReview(form: FormData) {
  const slug = str(form, 'slug')
  const back = `/review/new?company=${slug}`
  const user = await needUser(back)
  if (!(await passedTurnstile(form))) fail(back, 'Please complete the "Verify you are human" check.')
  if (!form.get('confirm')) fail(back, 'Please confirm the review is your own genuine experience.')
  const month = str(form, 'experienceDate')
  const payload = await payloadClient()
  try {
    await payload.create({
      collection: 'reviews',
      data: {
        company: num(form, 'company'),
        rating: num(form, 'rating'),
        title: str(form, 'title'),
        body: str(form, 'body'),
        experienceDate: month ? new Date(`${month}-01`).toISOString() : undefined,
        relationship: (str(form, 'relationship') || undefined) as 'client' | 'ex_client' | 'partner' | undefined,
        proofNote: str(form, 'proofNote') || undefined,
        status: 'pending',
      },
      user,
      overrideAccess: false,
    })
  } catch (err) {
    fail(back, errorText(err))
  }
  done(`/company/${slug}#reviews`, 'Thanks! Your review is waiting for a moderator. We sent you an email.')
}

export async function voteHelpful(form: FormData) {
  const slug = str(form, 'slug')
  const user = await needUser(`/company/${slug}#reviews`)
  const payload = await payloadClient()
  const review = await payload.findByID({ collection: 'reviews', id: num(form, 'review'), depth: 0 })
  const voters = (review.helpfulVoters ?? []).map(idOf)
  if (!voters.includes(user.id)) {
    await payload.update({
      collection: 'reviews',
      id: review.id,
      data: { helpfulVoters: [...voters, user.id], helpfulCount: (review.helpfulCount ?? 0) + 1 },
      context: { system: true, skipAudit: true },
    })
  }
  redirect(`/company/${slug}#review-${review.id}`)
}

export async function reportReview(form: FormData) {
  const slug = str(form, 'slug')
  const payload = await payloadClient()
  const user = await currentUser()
  const review = await payload.findByID({ collection: 'reviews', id: num(form, 'review'), depth: 0 })
  await payload.create({
    collection: 'reports',
    data: {
      kind: 'review_abuse',
      status: 'new',
      company: idOf(review.company),
      review: review.id,
      subject: `Review reported: ${review.title}`.slice(0, 200),
      message: str(form, 'reason') || 'Reported from the profile page',
      email: user?.email,
    },
  })
  await payload.update({ collection: 'reviews', id: review.id, data: { reportCount: (review.reportCount ?? 0) + 1 }, context: { system: true, skipAudit: true } })
  done(`/company/${slug}#reviews`, 'Thanks. A moderator will look at that review.')
}

// ---------- Company forms ----------

export async function submitClaim(form: FormData) {
  const slug = str(form, 'slug')
  const back = `/company/${slug}/claim`
  const user = await needUser(back)
  const payload = await payloadClient()
  try {
    await payload.create({
      collection: 'claims',
      data: { company: num(form, 'company'), user: user.id, name: str(form, 'name'), jobTitle: str(form, 'jobTitle'), workEmail: str(form, 'workEmail'), message: str(form, 'message'), status: 'new' },
      user,
    })
  } catch (err) {
    fail(back, errorText(err))
  }
  done(back, 'Claim received. We check every claim by hand and will email you, usually within two working days.')
}

export async function submitReport(form: FormData) {
  const slug = str(form, 'slug')
  const kind = str(form, 'kind') === 'rating_review' ? 'rating_review' : 'data_error'
  const back = `/company/${slug}/${kind === 'rating_review' ? 'rating-review' : 'report'}`
  if (!(await passedTurnstile(form))) fail(back, 'Please complete the "Verify you are human" check.')
  const payload = await payloadClient()
  try {
    await payload.create({
      collection: 'reports',
      data: { kind, status: 'new', company: num(form, 'company'), subject: str(form, 'subject'), message: str(form, 'message'), name: str(form, 'name'), email: str(form, 'email') || undefined },
    })
  } catch (err) {
    fail(back, errorText(err))
  }
  done(back, kind === 'rating_review' ? 'Request received. An analyst will review it and reply by email.' : 'Thanks. Our data team will check it against the official sources.')
}

export async function submitLead(form: FormData) {
  const type = (['callback', 'contact', 'business'].includes(str(form, 'type')) ? str(form, 'type') : 'contact') as 'callback' | 'contact' | 'business'
  const back = safePath(str(form, 'back'), '/contact')
  if (type === 'callback' && !form.get('consent')) fail(back, 'Please tick the box to agree to be contacted.')
  if (!(await passedTurnstile(form))) fail(back, 'Please complete the "Verify you are human" check.')
  const payload = await payloadClient()
  const company = num(form, 'company') || undefined
  try {
    await payload.create({
      collection: 'leads',
      data: {
        type,
        status: 'new',
        company,
        name: str(form, 'name'),
        contact: str(form, 'contact'),
        organisation: str(form, 'organisation') || undefined,
        interest: str(form, 'interest') || undefined,
        message: str(form, 'message') || undefined,
        consent: Boolean(form.get('consent')),
      },
    })
    // Call-back requests also go straight to the company's users.
    if (type === 'callback' && company) {
      const c = await payload.findByID({ collection: 'companies', id: company, depth: 1 })
      const emails = (c.managers ?? []).map((m) => (typeof m === 'object' ? m.email : null)).filter(Boolean) as string[]
      if (emails.length)
        await payload
          .sendEmail({ to: emails, subject: `New call-back request from BusinessLens`, html: `<p>${str(form, 'name')} asked for a call back about ${str(form, 'interest') || 'your services'}. Contact: ${str(form, 'contact')}</p>` })
          .catch(() => undefined)
    }
  } catch (err) {
    fail(back, errorText(err))
  }
  done(back, type === 'callback' ? 'Request sent. The company will contact you directly.' : 'Thanks, we received your message and will reply by email.')
}

export async function subscribe(form: FormData) {
  const back = safePath(str(form, 'back'), '/')
  const payload = await payloadClient()
  try {
    await payload.create({ collection: 'subscribers', data: { email: str(form, 'email') } })
  } catch {
    // Already subscribed is fine.
  }
  done(back, 'Subscribed. Thanks!')
}

// ---------- Business dashboard ----------

async function managedCompany(form: FormData) {
  const user = await needUser('/business/dashboard')
  const payload = await payloadClient()
  const company = await payload.findByID({ collection: 'companies', id: num(form, 'company'), depth: 0 })
  const managers = (company.managers ?? []).map(idOf)
  if (!managers.includes(user.id) && !hasRole(user)) fail('/business/dashboard', 'You do not manage that company.')
  return { user, payload, company }
}

export async function postReply(form: FormData) {
  const { payload, company } = await managedCompany(form)
  const review = await payload.findByID({ collection: 'reviews', id: num(form, 'review'), depth: 0 })
  if (idOf(review.company) !== company.id) fail('/business/dashboard', 'That review is not about your company.')
  await payload.update({
    collection: 'reviews',
    id: review.id,
    data: { replyText: str(form, 'reply'), replyStatus: 'pending', replyAt: new Date().toISOString() },
    context: { system: true },
  })
  done(`/business/dashboard?company=${company.id}#reviews`, 'Reply sent to moderation. It appears on your profile once approved.')
}

export async function requestEdit(form: FormData) {
  const { payload, company, user } = await managedCompany(form)
  await payload.create({ collection: 'edit-requests', data: { company: company.id, user: user.id, summary: str(form, 'summary'), details: str(form, 'details'), status: 'new' } })
  done(`/business/dashboard?company=${company.id}#edits`, 'Edit request sent. An editor checks it before anything changes.')
}

// ---------- Status page ----------

export async function sendTestEmail() {
  const user = await needUser('/status')
  const payload = await payloadClient()
  try {
    await payload.sendEmail({ to: user.email, subject: 'BusinessLens demo: test email', html: `<p>If you can read this, email sending works. Sent at ${new Date().toISOString()}.</p>` })
  } catch (err) {
    fail('/status', 'Email failed: ' + errorText(err))
  }
  done('/status', `Test email sent to ${user.email}.`)
}

export async function reindexSearch() {
  const user = await currentUser()
  if (user?.role !== 'admin') fail('/status', 'Only admins can rebuild the search index')
  const payload = await payloadClient()
  let n = 0
  try {
    n = await rebuildIndex(payload)
  } catch (err) {
    fail('/status', 'Search rebuild failed: ' + errorText(err))
  }
  done('/status', `Search index rebuilt with ${n} companies.`)
}
