import Link from 'next/link'

import { CompanyForm } from '@/components/site/CompanyForm'
import { getCompany } from '@/lib/companyPage'
import { domainOf } from '@/lib/format'
import type { SP } from '@/lib/params'
import { currentUser } from '@/lib/payload'
import { submitClaim } from '../../../actions'

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<SP> }

export const metadata = { title: 'Claim this profile', robots: { index: false } }

export default async function Claim({ params, searchParams }: Props) {
  const { slug } = await params
  const sp = await searchParams
  const [c, user] = await Promise.all([getCompany(slug), currentUser()])
  const domain = domainOf(c.website)
  return (
    <CompanyForm
      c={c}
      title="Claim this profile"
      message={sp.message}
      error={sp.error}
      intro={
        <>
          <p>Claiming is free. Once we confirm you work for {c.legalName}, you can suggest corrections, reply to reviews, see your rating breakdown with analyst comments, and add your logo.</p>
          <p style={{ margin: 0 }}>Claiming never changes the BusinessLens Rating.</p>
        </>
      }
    >
      {c.tier !== 'standard' && !sp.message ? (
        <p>This profile is already managed by the company. If you work there and need access, <Link href="/contact">contact us</Link>.</p>
      ) : !user ? (
        <p><Link className="btn" href={`/login?next=/company/${slug}/claim`}>Log in to continue</Link> <span className="small muted">or <Link href={`/signup?next=/company/${slug}/claim`}>create a free account</Link></span></p>
      ) : sp.message ? null : (
        <form action={submitClaim} className="form">
          <input type="hidden" name="company" value={c.id} />
          <input type="hidden" name="slug" value={slug} />
          <label>Your name<input name="name" defaultValue={user.name ?? ''} required /></label>
          <label>Job title<input name="jobTitle" required /></label>
          <label>Work email<input name="workEmail" type="email" placeholder={domain ? `you@${domain}` : 'you@company.com'} required /></label>
          {domain && <p className="tiny muted" style={{ margin: '-6px 0 0' }}>An email at {domain} is checked fastest. Other addresses need extra proof.</p>}
          <label>Anything we should know? (optional)<textarea name="message" rows={3} /></label>
          <button className="btn">Send claim</button>
        </form>
      )}
    </CompanyForm>
  )
}
