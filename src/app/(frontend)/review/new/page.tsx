import Link from 'next/link'

import { CompanyCard, Notice } from '@/components/site/CompanyList'
import { Turnstile } from '@/components/site/Turnstile'
import { findCompanies } from '@/lib/directory'
import type { PageProps } from '@/lib/params'
import { currentUser, payloadClient } from '@/lib/payload'
import { turnstileSiteKey } from '@/lib/turnstile'
import { postReview } from '../../actions'

export const metadata = { title: 'Write a review', robots: { index: false } }

export default async function NewReview({ searchParams }: PageProps) {
  const sp = await searchParams
  const user = await currentUser()
  const payload = await payloadClient()
  const company = sp.company
    ? (await payload.find({ collection: 'companies', where: { slug: { equals: sp.company } }, limit: 1, depth: 0 })).docs[0]
    : null
  const results = !company && sp.q ? await findCompanies({ q: sp.q }, 'relevance', 1, 8) : null
  const thisMonth = new Date().toISOString().slice(0, 7)

  return (
    <div className="wrap section" style={{ maxWidth: 760 }}>
      <h1>Write a review</h1>
      <p className="muted">Share your own experience as a client. Reviews are checked by a moderator before they appear. <Link href="/review-guidelines">Review guidelines</Link></p>
      <Notice message={sp.message} error={sp.error} />
      {!company && (
        <div className="card">
          <form action="/review/new" className="row" style={{ flexWrap: 'nowrap' }}>
            <input name="q" defaultValue={sp.q ?? ''} placeholder="Which company? Name, brand or licence number" aria-label="Company" required />
            <button className="btn">Find</button>
          </form>
          {results && (
            <div className="stack" style={{ marginTop: 14 }}>
              {results.hits.length === 0 && <p className="muted">No match. Try another spelling.</p>}
              {results.hits.map((h) => (
                <div key={h.id} className="row between">
                  <div style={{ flex: 1, minWidth: 0 }}><CompanyCard hit={h} compare={false} /></div>
                  <Link className="btn small" href={`/review/new?company=${h.slug}`}>Review this</Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {company && !user && (
        <div className="card">
          <p>You are reviewing <strong>{company.legalName}</strong>. Please log in first so we can make sure each person reviews a company only once a year.</p>
          <div className="row">
            <Link className="btn" href={`/login?next=${encodeURIComponent(`/review/new?company=${company.slug}`)}`}>Log in</Link>
            <Link className="btn secondary" href={`/signup?next=${encodeURIComponent(`/review/new?company=${company.slug}`)}`}>Create a free account</Link>
          </div>
        </div>
      )}
      {company && user && (
        <form action={postReview} className="card form" style={{ maxWidth: 'none' }}>
          <input type="hidden" name="company" value={company.id} />
          <input type="hidden" name="slug" value={company.slug} />
          <p style={{ margin: 0 }}>Reviewing <Link href={`/company/${company.slug}`}><strong>{company.legalName}</strong></Link> · <Link className="small" href="/review/new">change</Link></p>
          <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
            <legend style={{ fontWeight: 600, fontSize: 14.5 }}>Your rating</legend>
            <div className="ratingpick">
              {[5, 4, 3, 2, 1].map((n) => (
                <span key={n} style={{ display: 'contents' }}>
                  <input type="radio" id={`r${n}`} name="rating" value={n} required />
                  <label htmlFor={`r${n}`} title={`${n} star${n > 1 ? 's' : ''}`}>★</label>
                </span>
              ))}
            </div>
          </fieldset>
          <label>Title<input name="title" maxLength={90} placeholder="Sum up your experience" required /></label>
          <label>Your review<textarea name="body" rows={6} minLength={40} placeholder="What happened? Deposits, withdrawals, support, fees… (at least 40 characters)" required /></label>
          <div className="row" style={{ alignItems: 'flex-start' }}>
            <label style={{ flex: 1 }}>When was this?<input type="month" name="experienceDate" max={thisMonth} defaultValue={thisMonth} /></label>
            <label style={{ flex: 1 }}>You are a…
              <select name="relationship" defaultValue="client">
                <option value="client">Client</option>
                <option value="ex_client">Former client</option>
                <option value="partner">Business partner</option>
              </select>
            </label>
          </div>
          <label>Proof you are a client (optional, never shown publicly)<textarea name="proofNote" rows={2} placeholder="For example: account number ending 1234, month you opened the account" /></label>
          <label className="check"><input type="checkbox" name="confirm" value="1" required /> This is my own genuine experience. I have no link to this company or its competitors.</label>
          <Turnstile siteKey={turnstileSiteKey()} />
          <button className="btn">Submit review</button>
        </form>
      )}
    </div>
  )
}
