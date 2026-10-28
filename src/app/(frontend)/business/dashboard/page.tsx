import Link from 'next/link'
import { redirect } from 'next/navigation.js'

import { hasRole } from '@/access'
import { Notice } from '@/components/site/CompanyList'
import { CommunityScore, RatingBadge, Stars } from '@/components/site/Scores'
import { fmtDate } from '@/lib/format'
import type { PageProps } from '@/lib/params'
import { currentUser, payloadClient } from '@/lib/payload'
import { siteURL } from '@/lib/site'
import { postReply, requestEdit } from '../../actions'

export const metadata = { title: 'Business dashboard', robots: { index: false } }

export default async function Dashboard({ searchParams }: PageProps) {
  const sp = await searchParams
  const user = await currentUser()
  if (!user) redirect('/login?next=/business/dashboard')
  const payload = await payloadClient()
  const admin = hasRole(user)
  const { docs: companies } = await payload.find({
    collection: 'companies',
    where: admin ? { tier: { not_equals: 'standard' } } : { managers: { equals: user.id } },
    limit: 50,
    depth: 0,
    sort: 'legalName',
  })
  if (!companies.length)
    return (
      <div className="wrap section" style={{ maxWidth: 720 }}>
        <h1>Business dashboard</h1>
        <div className="card">
          <p>You don’t manage a company yet. Find your company and click <strong>Claim this profile</strong>. Once we approve the claim, it appears here.</p>
          <Link className="btn" href="/search">Find your company</Link>
        </div>
      </div>
    )
  const c = companies.find((x) => String(x.id) === sp.company) ?? companies[0]
  const [reviews, leads, edits, rating] = await Promise.all([
    payload.find({ collection: 'reviews', where: { company: { equals: c.id }, status: { equals: 'approved' } }, sort: '-createdAt', limit: 20, depth: 0 }),
    payload.find({ collection: 'leads', where: { company: { equals: c.id } }, sort: '-createdAt', limit: 20, depth: 0 }),
    payload.find({ collection: 'edit-requests', where: { company: { equals: c.id } }, sort: '-createdAt', limit: 10, depth: 0 }),
    payload.find({ collection: 'ratings', where: { company: { equals: c.id }, status: { equals: 'published' }, state: { equals: 'rated' } }, sort: '-publishedAt', limit: 1, depth: 0 }),
  ])
  const latest = rating.docs[0]
  const badge = `<a href="${siteURL()}/company/${c.slug}"><img src="${siteURL()}/badge/${c.slug}" alt="${c.legalName} on BusinessLens" width="220" height="64"></a>`

  return (
    <div className="wrap section">
      <div className="row between">
        <div>
          <h1 style={{ marginBottom: 4 }}>Business dashboard</h1>
          <p className="muted" style={{ margin: 0 }}>{c.legalName} · {c.tier === 'partner' ? 'Partner' : 'Claimed'} profile · <Link href={`/company/${c.slug}`}>View public page</Link></p>
        </div>
        {companies.length > 1 && (
          <form className="row" action="/business/dashboard">
            <select name="company" defaultValue={c.id} aria-label="Company" style={{ width: 'auto' }}>
              {companies.map((x) => <option key={x.id} value={x.id}>{x.legalName}</option>)}
            </select>
            <button className="btn secondary small">Switch</button>
          </form>
        )}
      </div>
      {admin && <p className="tiny muted">You are an admin, so you can open every claimed or Partner company here.</p>}
      <Notice message={sp.message} error={sp.error} />
      <div className="stats" style={{ margin: '16px 0' }}>
        <div className="stat"><RatingBadge size="mini" state={c.ratingState} rating={c.ratingOverall} band={c.ratingBand} color={c.ratingColor} /><span>BusinessLens Rating</span></div>
        <div className="stat"><CommunityScore avg={c.reviewAverage} count={c.reviewCount} /><span>Community Score</span></div>
        <div className="stat"><b>{reviews.docs.filter((r) => !r.replyStatus || r.replyStatus === 'none').length}</b><span>reviews without a reply</span></div>
        <div className="stat"><b>{leads.totalDocs}</b><span>leads</span></div>
      </div>
      <div className="grid-2">
        <div className="stack" style={{ gap: 16 }}>
          <section className="card" id="rating">
            <h2>Your rating breakdown</h2>
            {latest ? (
              <div className="stack">
                {(latest.scores ?? []).map((s) => (
                  <div key={s.id ?? s.criterion}>
                    <div className="row between small"><span>{s.criterion}</span><strong>{s.score ?? 0}/{s.max}</strong></div>
                    <div className="bar"><i style={{ width: `${((s.score ?? 0) / s.max) * 100}%`, background: 'var(--brand-2)' }} /></div>
                    {s.shareableNote && <p className="small" style={{ margin: '4px 0 0' }}>💬 <em>Analyst:</em> {s.shareableNote}</p>}
                  </div>
                ))}
                <p className="tiny muted" style={{ margin: 0 }}>Published {fmtDate(latest.publishedAt)} · {latest.methodologyVersion}. Only comments the analyst marked “shareable” are shown. To challenge the rating, use <Link href={`/company/${c.slug}/rating-review`}>Request a rating review</Link>.</p>
              </div>
            ) : (
              <p className="muted" style={{ margin: 0 }}>Your company has not been rated yet.</p>
            )}
          </section>

          <section className="card" id="reviews">
            <h2>Reply to reviews</h2>
            <p className="small muted">One public reply per review. A moderator checks it before it appears.</p>
            {reviews.docs.length === 0 && <p className="muted">No approved reviews yet.</p>}
            {reviews.docs.map((r) => (
              <div key={r.id} className="review">
                <div className="row" style={{ gap: 8 }}><Stars value={r.rating} /><strong>{r.title}</strong><span className="tiny muted">{fmtDate(r.createdAt)}</span></div>
                <p className="small" style={{ margin: '4px 0' }}>{r.body}</p>
                {r.replyStatus === 'approved' && <div className="reply"><strong className="small">Your reply (live)</strong><p style={{ margin: 0 }}>{r.replyText}</p></div>}
                {r.replyStatus === 'pending' && <div className="reply"><strong className="small">Your reply (waiting for moderation)</strong><p style={{ margin: 0 }}>{r.replyText}</p></div>}
                {(!r.replyStatus || r.replyStatus === 'none' || r.replyStatus === 'rejected') && (
                  <form action={postReply} className="stack" style={{ marginTop: 6 }}>
                    <input type="hidden" name="company" value={c.id} />
                    <input type="hidden" name="review" value={r.id} />
                    {r.replyStatus === 'rejected' && <p className="tiny" style={{ color: 'var(--danger)', margin: 0 }}>Your previous reply was not approved. Please keep replies factual and polite.</p>}
                    <textarea name="reply" rows={2} placeholder="Write a public reply" required aria-label="Reply" />
                    <div><button className="btn small">Send reply</button></div>
                  </form>
                )}
              </div>
            ))}
          </section>

          <section className="card" id="leads">
            <div className="section-title"><h2 style={{ margin: 0 }}>Leads</h2>{leads.totalDocs > 0 && <a className="btn secondary small" href={`/business/dashboard/leads.csv?company=${c.id}`}>Download CSV</a>}</div>
            {c.tier !== 'partner' && <p className="small muted">The call-back form is part of the Partner profile.</p>}
            {leads.docs.length === 0 ? (
              <p className="muted" style={{ margin: 0 }}>No leads yet.</p>
            ) : (
              <div className="table-wrap">
                <table className="data">
                  <thead><tr><th>Date</th><th>Name</th><th>Contact</th><th>Interest</th></tr></thead>
                  <tbody>{leads.docs.map((l) => <tr key={l.id}><td>{fmtDate(l.createdAt)}</td><td>{l.name}</td><td>{l.contact}</td><td>{l.interest}</td></tr>)}</tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <aside className="stack" style={{ gap: 16 }}>
          <section className="card" id="edits">
            <h3>Suggest a profile edit</h3>
            <p className="small muted">An editor checks every change against official sources before it goes live.</p>
            <form action={requestEdit} className="form">
              <input type="hidden" name="company" value={c.id} />
              <label>What should change?<input name="summary" placeholder="For example: new office address" required /></label>
              <label>Details and source<textarea name="details" rows={3} required /></label>
              <button className="btn small">Send</button>
            </form>
            {edits.docs.length > 0 && (
              <ul className="small" style={{ paddingInlineStart: 18, marginBottom: 0 }}>
                {edits.docs.map((e) => <li key={e.id}>{e.summary} <span className="chip">{e.status.replace('_', ' ')}</span></li>)}
              </ul>
            )}
          </section>
          <section className="card">
            <h3>Your rating badge</h3>
            <img src={`/badge/${c.slug}`} alt="Rating badge" width={220} height={64} />
            <pre className="code">{badge}</pre>
          </section>
          <section className="card">
            <h3>Profile views</h3>
            <p className="small muted" style={{ margin: 0 }}>View counts arrive with the analytics set-up in the real build.</p>
          </section>
        </aside>
      </div>
    </div>
  )
}
