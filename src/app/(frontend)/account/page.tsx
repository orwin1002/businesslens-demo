import Link from 'next/link'
import { redirect } from 'next/navigation.js'

import { isStaffUser } from '@/access'
import { Notice } from '@/components/site/CompanyList'
import { Stars } from '@/components/site/Scores'
import { fmtDate } from '@/lib/format'
import type { PageProps } from '@/lib/params'
import { currentUser, payloadClient } from '@/lib/payload'

export const metadata = { title: 'My account', robots: { index: false } }

const STATUS: Record<string, string> = { pending: 'Waiting for moderation', approved: 'Live', rejected: 'Not approved' }

export default async function Account({ searchParams }: PageProps) {
  const sp = await searchParams
  const user = await currentUser()
  if (!user) redirect('/login?next=/account')
  const payload = await payloadClient()
  const [{ docs: reviews }, { docs: claims }] = await Promise.all([
    payload.find({ collection: 'reviews', where: { author: { equals: user.id } }, depth: 1, sort: '-createdAt', overrideAccess: true }),
    payload.find({ collection: 'claims', where: { user: { equals: user.id } }, depth: 1, sort: '-createdAt', overrideAccess: true }),
  ])
  return (
    <div className="wrap section" style={{ maxWidth: 860 }}>
      <div className="row between">
        <div>
          <h1 style={{ marginBottom: 4 }}>Hello, {user.name || user.email}</h1>
          <p className="muted" style={{ margin: 0 }}>{user.email} · {user.role === 'member' ? 'Member' : user.role}</p>
        </div>
        <form action="/logout" method="post"><button className="btn secondary">Sign out</button></form>
      </div>
      <Notice message={sp.message} error={sp.error} />
      <div className="row" style={{ margin: '16px 0' }}>
        {isStaffUser(user) && <a className="btn" href="/admin">Open the admin panel</a>}
        {(user.role === 'business' || user.role === 'admin') && <Link className="btn secondary" href="/business/dashboard">Business dashboard</Link>}
        <Link className="btn secondary" href="/review/new">Write a review</Link>
      </div>
      <section className="card">
        <h2>Your reviews</h2>
        {reviews.length === 0 && <p className="muted" style={{ margin: 0 }}>None yet.</p>}
        {reviews.map((r) => (
          <div key={r.id} className="review">
            <div className="row between">
              <span className="row" style={{ gap: 8 }}><Stars value={r.rating} /><strong>{r.title}</strong></span>
              <span className={`chip ${r.status === 'approved' ? 'ok' : r.status === 'rejected' ? 'danger' : 'warn'}`}>{STATUS[r.status]}</span>
            </div>
            <div className="small muted">{typeof r.company === 'object' ? <Link href={`/company/${r.company.slug}`}>{r.company.legalName}</Link> : ''} · {fmtDate(r.createdAt)}</div>
          </div>
        ))}
      </section>
      {claims.length > 0 && (
        <section className="card">
          <h2>Your claims</h2>
          <ul style={{ paddingInlineStart: 18, margin: 0 }}>
            {claims.map((c) => <li key={c.id}>{typeof c.company === 'object' ? c.company.legalName : ''} <span className="chip">{c.status.replace('_', ' ')}</span></li>)}
          </ul>
        </section>
      )}
      <p className="tiny muted" style={{ marginTop: 12 }}>Watchlist and alerts by email arrive in a later phase.</p>
    </div>
  )
}
